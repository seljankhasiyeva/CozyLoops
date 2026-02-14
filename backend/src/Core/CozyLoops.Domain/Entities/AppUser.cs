using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace CozyLoops.Domain.Entities
{
    public class AppUser: IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string? Address { get; set; } 
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
