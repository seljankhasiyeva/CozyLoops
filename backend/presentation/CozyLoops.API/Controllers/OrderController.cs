using System.Security.Claims;
using CozyLoops.Domain.Entities;
using CozyLoops.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
            {
                return BadRequest("Your basket is empty.");
            }

            var order = new Order
            {
                AppUserId = userId,
                Address = address,
                OrderDate = DateTime.Now,
                OrderNumber = Guid.NewGuid().ToString().Substring(0, 8).ToUpper(), 
                TotalPrice = basket.BasketItems.Sum(bi => bi.Product.Price * bi.Quantity),
                OrderItems = new List<OrderItem>()
            };

            foreach (var item in basket.BasketItems)
            {
                var orderItem = new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.Product.Price 
                };
                order.OrderItems.Add(orderItem);
            }

            _context.Orders.Add(order);

            _context.BasketItems.RemoveRange(basket.BasketItems);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Order placed successfully!",
                orderNumber = order.OrderNumber,
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
    }
}
