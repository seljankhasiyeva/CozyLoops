using CozyLoops.Domain.DTOs;
using CozyLoops.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/Settings/ShippingCost — frontend buradan alır
        [HttpGet("{key}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSetting(string key)
        {
            var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null)
                return NotFound($"Setting '{key}' not found.");

            return Ok(new { key = setting.Key, value = setting.Value });
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllSettings()
        {
            var settings = await _context.Settings.ToListAsync();
            return Ok(settings);
        }

        [HttpPut("{key}")]
        [Authorize]
        public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingDto dto)
        {
            var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null)
                return NotFound($"Setting '{key}' not found.");

            setting.Value = dto.Value;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"'{key}' updated to '{dto.Value}' successfully." });
        }
    }
}
