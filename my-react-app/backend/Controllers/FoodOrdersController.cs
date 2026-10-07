using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FoodOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FoodOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/FoodOrders
        [HttpGet]
        public async Task<IActionResult> GetFoodOrders()
        {
            var orders = await _context.FoodOrders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Food)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    foodOrderId = o.FoodOrderId,

                    userId = o.UserId,

                    userName = o.User != null
                        ? o.User.FullName
                        : "",

                    userEmail = o.User != null
                        ? o.User.Email
                        : "",

                    totalAmount = o.TotalAmount,

                    status = o.Status,

                    createdAt = o.CreatedAt,

                    items = o.Items
                        .Select(i => new
                        {
                            foodOrderItemId = i.FoodOrderItemId,
                            foodId = i.FoodId,

                            foodName = i.Food != null
                                ? i.Food.Name
                                : "",

                            quantity = i.Quantity,

                            unitPrice = i.UnitPrice,

                            amount = i.Quantity * i.UnitPrice
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/FoodOrders/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetFoodOrder(int id)
        {
            var order = await _context.FoodOrders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Food)
                .Where(o => o.FoodOrderId == id)
                .Select(o => new
                {
                    foodOrderId = o.FoodOrderId,

                    userId = o.UserId,

                    userName = o.User != null
                        ? o.User.FullName
                        : "",

                    userEmail = o.User != null
                        ? o.User.Email
                        : "",

                    totalAmount = o.TotalAmount,

                    status = o.Status,

                    createdAt = o.CreatedAt,

                    items = o.Items
                        .Select(i => new
                        {
                            foodOrderItemId = i.FoodOrderItemId,

                            foodId = i.FoodId,

                            foodName = i.Food != null
                                ? i.Food.Name
                                : "",

                            quantity = i.Quantity,

                            unitPrice = i.UnitPrice,

                            amount = i.Quantity * i.UnitPrice
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (order == null)
            {
                return NotFound(new
                {
                    message = "Đơn bắp nước không tồn tại."
                });
            }

            return Ok(order);
        }

        // POST: api/FoodOrders
        [HttpPost]
        public async Task<IActionResult> CreateFoodOrder(
            [FromBody] CreateFoodOrderRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu đơn hàng không hợp lệ."
                });
            }

            if (request.UserId <= 0)
            {
                return BadRequest(new
                {
                    message = "UserId không hợp lệ."
                });
            }

            if (request.Items == null || request.Items.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Đơn hàng phải có ít nhất một món."
                });
            }

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == request.UserId);

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "Người dùng không tồn tại."
                });
            }

            var foodIds = request.Items
                .Select(i => i.FoodId)
                .Distinct()
                .ToList();

            var foods = await _context.Foods
                .Where(f => foodIds.Contains(f.FoodId))
                .ToListAsync();

            if (foods.Count != foodIds.Count)
            {
                return BadRequest(new
                {
                    message = "Có món ăn không tồn tại."
                });
            }

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                {
                    return BadRequest(new
                    {
                        message = "Số lượng món phải lớn hơn 0."
                    });
                }

                var food = foods.First(f => f.FoodId == item.FoodId);

                if (food.Status != "Đang bán")
                {
                    return BadRequest(new
                    {
                        message = $"Món {food.Name} hiện không bán."
                    });
                }
            }

            var order = new FoodOrder
            {
                UserId = request.UserId,
                Status = "Chờ xử lý",
                CreatedAt = DateTime.Now
            };

            decimal totalAmount = 0;

            foreach (var item in request.Items)
            {
                var food = foods.First(f => f.FoodId == item.FoodId);

                var orderItem = new FoodOrderItem
                {
                    FoodId = food.FoodId,
                    Quantity = item.Quantity,

                    // Lấy giá trực tiếp từ database,
                    // không tin giá gửi từ frontend.
                    UnitPrice = food.Price
                };

                totalAmount += food.Price * item.Quantity;

                order.Items.Add(orderItem);
            }

            order.TotalAmount = totalAmount;

            _context.FoodOrders.Add(order);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetFoodOrder),
                new { id = order.FoodOrderId },
                new
                {
                    foodOrderId = order.FoodOrderId,
                    userId = order.UserId,
                    totalAmount = order.TotalAmount,
                    status = order.Status,
                    createdAt = order.CreatedAt
                });
        }

        // PUT: api/FoodOrders/1/status
        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateFoodOrderStatus(
            int id,
            [FromBody] UpdateFoodOrderStatusRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new
                {
                    message = "Trạng thái không hợp lệ."
                });
            }

            var order = await _context.FoodOrders
                .FirstOrDefaultAsync(o => o.FoodOrderId == id);

            if (order == null)
            {
                return NotFound(new
                {
                    message = "Đơn bắp nước không tồn tại."
                });
            }

            var allowedStatuses = new[]
            {
                "Chờ xử lý",
                "Đang chuẩn bị",
                "Đã hoàn thành",
                "Đã hủy"
            };

            var newStatus = request.Status.Trim();

            if (!allowedStatuses.Contains(newStatus))
            {
                return BadRequest(new
                {
                    message =
                        "Trạng thái không hợp lệ. " +
                        "Chỉ được dùng: Chờ xử lý, " +
                        "Đang chuẩn bị, Đã hoàn thành, Đã hủy."
                });
            }

            order.Status = newStatus;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật trạng thái đơn thành công.",

                foodOrderId = order.FoodOrderId,

                status = order.Status
            });
        }

        // DELETE: api/FoodOrders/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteFoodOrder(int id)
        {
            var order = await _context.FoodOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.FoodOrderId == id);

            if (order == null)
            {
                return NotFound(new
                {
                    message = "Đơn bắp nước không tồn tại."
                });
            }

            _context.FoodOrderItems.RemoveRange(order.Items);

            _context.FoodOrders.Remove(order);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa đơn bắp nước thành công."
            });
        }
    }

    public class CreateFoodOrderRequest
    {
        public int UserId { get; set; }

        public List<CreateFoodOrderItemRequest> Items { get; set; }
            = new();
    }

    public class CreateFoodOrderItemRequest
    {
        public int FoodId { get; set; }

        public int Quantity { get; set; }
    }

    public class UpdateFoodOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}