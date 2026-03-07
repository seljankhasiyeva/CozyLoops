using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CozyLoops.Domain.Entities
{
    public enum OrderStatus
    {
        Pending = 0,
        Crafting = 1,
        Shipped = 2,
        Delivered = 3
    }
}
