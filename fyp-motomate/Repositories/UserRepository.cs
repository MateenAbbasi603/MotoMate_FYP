// Repositories/UserRepository.cs
using fyp_motomate.Data;
using fyp_motomate.Models;
using fyp_motomate.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace fyp_motomate.Repositories
{
    public interface IUserRepository
    {
        Task<User> RegisterAsync(User user, string password);
        Task<User> LoginAsync(string username, string password);
        Task<User> GetByIdAsync(int id);
        Task<User> GetByUsernameAsync(string username);
        Task<User> GetByEmailAsync(string email);
        Task<bool> UpdateUserAsync(User user);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<bool> UserExistsAsync(string username);
        Task<bool> EmailExistsAsync(string email);
    }

    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        private bool VerifyPasswordHash(string password, string storedHash)
        {
            // For simplicity, using BCrypt for password hashing
            return BCrypt.Net.BCrypt.Verify(password, storedHash);
        }

        public async Task<User> RegisterAsync(User user, string password)
        {
            if (await UserExistsAsync(user.Username))
                return null;

            if (await EmailExistsAsync(user.Email))
                return null;

            // Hash the password
            user.Password = BCrypt.Net.BCrypt.HashPassword(password);

            // Add user to database
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<User> LoginAsync(string username, string password)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return null;

            if (!VerifyPasswordHash(password, user.Password))
                return null;

   // Ensure imgUrl is not null to prevent SqlNullValueException
            if (user.imgUrl == null)
            {
                user.imgUrl = ""; // Set default empty string
            }

            return user;
        }

        public async Task<User> GetByIdAsync(int id)
        {
            return await _context.Users
               
                .FirstOrDefaultAsync(u => u.UserId == id);
        }

        public async Task<User> GetByUsernameAsync(string username)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return false;

            if (!VerifyPasswordHash(currentPassword, user.Password))
                return false;

            // Update with new password hash
            user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> UserExistsAsync(string username)
        {
            return await _context.Users.AnyAsync(u => u.Username == username);
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }
    }

    // Program.cs - Repository registration
    // builder.Services.AddScoped<IUserRepository, UserRepository>();
}