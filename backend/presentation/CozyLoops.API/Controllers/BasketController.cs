using System.Security.Claims;
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
    public class BasketController : ControllerBase
    {
        private readonly AppDbContext _context;
        public BasketController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetBasket()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized("User ID claim not found.");
            }
            var basket = await _context.Baskets
                .Include(b => b.BasketItems)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(b => b.AppUserId == userId);
            if (basket == null)
            {
                return NotFound("Basket not found for the user.");
            }
            return Ok(basket);
        }

        [HttpPost("add-item")]

        public async Task<IActionResult> AddItemToBasket(int productId, int quantity)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized("User ID claim not found.");
            }
            var basket = await _context.Baskets
                .Include(b => b.BasketItems)
                .FirstOrDefaultAsync(b => b.AppUserId == userId);
            if (basket == null)
            {
                basket = new Domain.Entities.Basket { AppUserId = userId };
                _context.Baskets.Add(basket);
                await _context.SaveChangesAsync();
            }
            var basketItem = basket.BasketItems.FirstOrDefault(i => i.ProductId == productId);
            if (basketItem != null)
            {
                basketItem.Quantity += quantity;
            }
            else
            {
                basketItem = new Domain.Entities.BasketItem
                {
                    ProductId = productId,
                    Quantity = quantity,
                    BasketId = basket.Id
                };
                basket.BasketItems.Add(basketItem);
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Item added to basket successfully!" });
        }

        [HttpPost("remove-item")]

        public async Task<IActionResult> RemoveItemFromBasket(int productId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized("User ID claim not found.");
            }
            var basket = await _context.Baskets
                .Include(b => b.BasketItems)
                .FirstOrDefaultAsync(b => b.AppUserId == userId);
            if (basket == null)
            {
                return NotFound("Basket not found for the user.");
            }
            var basketItem = basket.BasketItems.FirstOrDefault(i => i.ProductId == productId);
            if (basketItem == null)
            {
                return NotFound("Item not found in the basket.");
            }
            basket.BasketItems.Remove(basketItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Item removed from basket successfully!" });
        }

        [HttpPost("update-quantity")]
        public async Task<IActionResult> UpdateQuantity(int productId, int quantity)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var basket = await _context.Baskets
                .Include(b => b.BasketItems)
                .FirstOrDefaultAsync(b => b.AppUserId == userId);

            if (basket == null) return NotFound("Basket not found");

            var basketItem = basket.BasketItems.FirstOrDefault(i => i.ProductId == productId);
            if (basketItem == null) return NotFound("Item not found");

            if (quantity <= 0)
            {
                basket.BasketItems.Remove(basketItem);
            }
            else
            {
                basketItem.Quantity = quantity; 
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Quantity updated successfully" });
        }
    }
}
