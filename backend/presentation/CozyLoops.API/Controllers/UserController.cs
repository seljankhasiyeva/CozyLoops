using CozyLoops.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CozyLoops.Domain.Entities;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly AppDbContext _context;

        public UserController(UserManager<AppUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();

            // Bütün orderləri bir dəfəyə al — EF Core conflict olmur
            var allOrders = await _context.Orders.ToListAsync();

            var result = users.Select(user =>
            {
                var userOrders = allOrders.Where(o => o.AppUserId == user.Id).ToList();

                return new
                {
                    user.Id,
                    user.FullName,
                    user.UserName,
                    user.Email,
                    user.CreatedDate,
                    orderCount = userOrders.Count,
                    totalSpent = userOrders.Sum(o => o.TotalPrice),
                    lastOrderDate = userOrders.Any()
                        ? userOrders.Max(o => o.OrderDate)
                        : (DateTime?)null
                };
            })
            .OrderByDescending(u => u.orderCount)
            .ToList();

            return Ok(result);
        }
    }
}