using CozyLoops.Domain.Entities;
using CozyLoops.Persistence.Contexts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly AppDbContext _context;
        public CustomerController(UserManager<AppUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userManager.Users.ToListAsync();
            var customers = users.Select(u => new
            {
                u.Id,
                u.Email,
                u.UserName,
                TotalOrders = _context.Orders.Count(o => o.AppUserId == u.Id),
                Status = "Active"
            }).ToList();
            return Ok(customers);
        }
    }

}
