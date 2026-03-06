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

            return Ok(orders);
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
                    status = "Pending",
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
    }
}