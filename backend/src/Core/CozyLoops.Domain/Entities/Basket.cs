using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CozyLoops.Domain.Entities
{
    public class Basket
    {
        public int Id { get; set; }
        public string AppUserId { get; set; } = string.Empty;
        public AppUser AppUser { get; set; } = null!;
        public ICollection<BasketItem> BasketItems { get; set; } = new List<BasketItem>();
    }
}
