using System.Security.Claims;
using CozyLoops.Domain.Entities;
using CozyLoops.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> CreateOrder(string address)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var basket = await _context.Baskets
                .Include(b => b.BasketItems)
                .ThenInclude(bi => bi.Product)
                .FirstOrDefaultAsync(b => b.AppUserId == userId);

            if (basket == null || !basket.BasketItems.Any())
                return BadRequest("Your basket is empty.");

            // Shipping cost-u Settings-dən al
            var shippingSetting = await _context.Settings
                .FirstOrDefaultAsync(s => s.Key == "ShippingCost");
            decimal shippingCost = shippingSetting != null
                ? decimal.Parse(shippingSetting.Value)
                : 5;

            var subtotal = basket.BasketItems.Sum(item => item.Quantity * item.Product.Price);

            var order = new Order
            {
                AppUserId = userId,
                Address = address,
                OrderDate = DateTime.Now,
                OrderNumber = Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                TotalPrice = subtotal + shippingCost, // shipping daxildir
                OrderItems = new List<OrderItem>()
            };

            foreach (var item in basket.BasketItems)
            {
                order.OrderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.Product.Price
                });
            }

            _context.Orders.Add(order);
            _context.BasketItems.RemoveRange(basket.BasketItems);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Order placed successfully!",
                orderNumber = order.OrderNumber,
                subtotal = subtotal,
                shippingCost = shippingCost,
                total = order.TotalPrice
            });
        }

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var orders = await _context.Orders
                .Where(o => o.AppUserId == userId)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders.Select(o => new {
                o.Id,
                o.OrderNumber,
                o.OrderDate,
                o.TotalPrice,
                o.Address,
                status = o.Status.ToString(), // "Pending", "Crafting" və s.
                orderItems = o.OrderItems.Select(oi => new {
                    oi.Quantity,
                    oi.UnitPrice,
                    product = new
                    {
                        oi.Product.Name,
                        oi.Product.ImageUrl
                    }
                })
            }));
        }

        [HttpGet("all-orders")]
        [Authorize]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.AppUser)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new {
                    o.Id,
                    o.OrderNumber,
                    customerName = o.AppUser.UserName,
                    o.TotalPrice,
                    o.OrderDate,
                    status = o.Status.ToString(),
                    itemCount = o.OrderItems.Count
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("stats")]
        [Authorize]
        public async Task<IActionResult> GetOrderStats()
        {
            var stats = new
            {
                totalSales = await _context.Orders.SumAsync(o => o.TotalPrice),
                totalOrders = await _context.Orders.CountAsync(),
                totalCustomers = await _context.Users.CountAsync()
            };

            return Ok(stats);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatus status)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated.", status = order.Status.ToString() });
        }

        [HttpGet("sales-chart")]
        [Authorize]
        public async Task<IActionResult> GetSalesChart()
        {
            var fourWeeksAgo = DateTime.Now.AddDays(-28);

            var orders = await _context.Orders
                .Where(o => o.OrderDate >= fourWeeksAgo)
                .ToListAsync();

            var weeks = new decimal[4];

            foreach (var order in orders)
            {
                var daysAgo = (DateTime.Now - order.OrderDate).Days;
                if (daysAgo < 7) weeks[3] += order.TotalPrice;
                else if (daysAgo < 14) weeks[2] += order.TotalPrice;
                else if (daysAgo < 21) weeks[1] += order.TotalPrice;
                else weeks[0] += order.TotalPrice;
            }

            return Ok(new
            {
                labels = new[] { "Week 1", "Week 2", "Week 3", "Week 4" },
                data = weeks
            });
        }
    }
}