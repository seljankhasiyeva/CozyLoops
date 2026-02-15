using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CozyLoops.Domain.DTOs;
using CozyLoops.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace CozyLoops.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        public AuthController(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpPost("register")]

        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var user = new AppUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                FullName = registerDto.FullName
            };
            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (result.Succeeded)
            {
                return Ok(new { Message = "User registered successfully" });
            }
            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("FullName", user.FullName ?? ""),
            new Claim(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        }; 

                var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("en_azi_otuz_iki_simvoldan_ibaret_olmali_very_secret_key_2026_cff_final_project"));

                var token = new JwtSecurityToken(
                    issuer: "CozyLoops",
                    audience: "CozyLoopsClient",
                    expires: DateTime.Now.AddHours(3),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

                return Ok(new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    expiration = token.ValidTo,
                    userName = user.FullName ?? user.UserName,
                    message = "Login successful"
                });
            }
            return Unauthorized(new { message = "Invalid email or password" });
        }
    }
}
