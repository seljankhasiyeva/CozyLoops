using System.Security.Claims;
using CozyLoops.Domain.Entities;
using CozyLoops.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReviewController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReviewController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductReviews(int productId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.AppUser) 
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.Id) 
                .Select(r => new {
                    r.Id,
                    r.Comment,
                    r.Rating,
                    UserName = r.AppUser.UserName, 
                    r.ProductId
                })
                .ToListAsync();

            return Ok(reviews);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddReview(Review review)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null) return Unauthorized();

            review.AppUserId = userId; 

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Your review has been added successfully!" });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var review = await _context.Reviews.FindAsync(id);

            if (review == null) return NotFound("Review not found.");

            if (review.AppUserId != userId)
            {
                return Forbid("You can only delete your own reviews.");
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review deleted successfully." });
        }
    }
}
