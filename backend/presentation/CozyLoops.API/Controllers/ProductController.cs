using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CozyLoops.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using CozyLoops.Domain.Entities;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ProductController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _context.Products.Include(p => p.Reviews).ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products.Include(p => p.Reviews).FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found.");
            }
            return Ok(product);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product created successfully!", productId = product.Id });
        }
    }
}
