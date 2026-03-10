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
            var products = await _context.Products.Include(p => p.Category).Include(p => p.Reviews).ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products.Include(p => p.Category).Include(p => p.Reviews).FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found.");
            }
            return Ok(product);
        }

        //[HttpPost]
        //public async Task<IActionResult> Create([FromForm] Product product, IFormFile? image)
        //{
        //    try
        //    {
        //        if (image != null && image.Length > 0)
        //        {
        //            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
        //            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images/products", fileName);

        //            var directory = Path.GetDirectoryName(filePath);
        //            if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);

        //            using (var stream = new FileStream(filePath, FileMode.Create))
        //            {
        //                await image.CopyToAsync(stream);
        //            }
        //            product.ImageUrl = "/images/products/" + fileName;
        //        }

        //        _context.Products.Add(product);
        //        await _context.SaveChangesAsync();

        //        return Ok(new { message = "Product created successfully!", productId = product.Id });
        //    }
        //    catch (Exception ex)
        //    {
        //        return BadRequest($"An error occured: {ex.Message}");
        //    }
        //}

        [HttpPost]
        public async Task<IActionResult> Create(
    [FromForm] string Name,
    [FromForm] decimal Price,
    [FromForm] string ProductCode,
    [FromForm] string Material,
    [FromForm] int Stock,
    [FromForm] string Description,
    [FromForm] int CategoryId,
    [FromForm] string? ImageUrl, 
    IFormFile? image)
        {
            try
            {
                var product = new Product
                {
                    Name = Name,
                    Price = Price,
                    ProductCode = ProductCode,
                    Material = Material,
                    Stock = Stock,
                    Description = Description,
                    CategoryId = CategoryId,
                    ImageUrl = "" 
                };

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

                return Ok(new { message = "Product created successfully!", productId = product.Id });
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occured: {ex.Message}");
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
            existingProduct.Material = updatedProduct.Material;

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
            return Ok(new { message = "Product updated successfully!" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            if (!string.IsNullOrEmpty(product.ImageUrl))
            {
                var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", product.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldFilePath)) System.IO.File.Delete(oldFilePath);
            }
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product deleted successfully!" });
        }
    }
}
