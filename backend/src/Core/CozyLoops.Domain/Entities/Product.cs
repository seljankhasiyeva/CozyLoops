using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CozyLoops.Domain.Entities
{
    public class Product
    {
        public int Id { get; set; }

        public string ProductCode { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;

        public string Material { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;
    }
}
