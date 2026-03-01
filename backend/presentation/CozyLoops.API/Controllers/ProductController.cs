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
        public async Task<IActionResult> Create([FromForm] Product product, IFormFile? image)
        {
            try
            {
                if (image != null && image.Length > 0)
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images/products", fileName);

                    var directory = Path.GetDirectoryName(filePath);
                    if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await image.CopyToAsync(stream);
                    }
                    product.ImageUrl = "/images/products/" + fileName;
                }

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Məhsul uğurla yaradıldı!", productId = product.Id });
            }
            catch (Exception ex)
            {
                return BadRequest($"Xəta baş verdi: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] Product updatedProduct, IFormFile? image)
        {
            var existingProduct = await _context.Products.FindAsync(id);
            if (existingProduct == null) return NotFound();

            existingProduct.Name = updatedProduct.Name;
            existingProduct.Price = updatedProduct.Price;
            existingProduct.Stock = updatedProduct.Stock;
            existingProduct.Description = updatedProduct.Description;
            existingProduct.ProductCode = updatedProduct.ProductCode; 
            existingProduct.CategoryId = updatedProduct.CategoryId;

            if (image != null && image.Length > 0)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images/products", fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }
                existingProduct.ImageUrl = "/images/products/" + fileName;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Məhsul yeniləndi!" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Məhsul sistemdən silindi!" });
        }
    }
}
