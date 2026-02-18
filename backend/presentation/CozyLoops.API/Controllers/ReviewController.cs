using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CozyLoops.Persistence.Contexts;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class ReviewController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReviewController(AppDbContext context)
        {
            _context = context;
        }

        //[HttpGet]
        //public async Task<IActionResult> GetAll()
        //{
        //    var reviews = await _context.Reviews.ToListAsync();
        //    return Ok(reviews);
        //}
    }
}
