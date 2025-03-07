﻿// Controllers/AuthController.cs
using fyp_motomate.Models;
using fyp_motomate.Models.DTOs;
using fyp_motomate.Models;
using fyp_motomate.Repositories;
using fyp_motomate.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;

        public AuthController(IUserRepository userRepository, ITokenService tokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto registerDto)
        {
            // Only allow customer registration through this endpoint
            if (registerDto.Role != "customer")
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Only customer registration is allowed through this endpoint"
                });
            }

            if (await _userRepository.UserExistsAsync(registerDto.Username))
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Username already exists"
                });

            if (await _userRepository.EmailExistsAsync(registerDto.Email))
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Email already exists"
                });

            // Create user object
            var user = new User
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                Role = "customer",
                Name = registerDto.Name,
                Phone = registerDto.Phone,
                Address = registerDto.Address,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Register the user
            var createdUser = await _userRepository.RegisterAsync(user, registerDto.Password);

            if (createdUser == null)
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Failed to register user"
                });

            // Generate JWT token
            var token = _tokenService.CreateToken(createdUser);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful",
                Token = token,
                User = new UserDto
                {
                    UserId = createdUser.UserId,
                    Username = createdUser.Username,
                    Email = createdUser.Email,
                    Role = createdUser.Role,
                    Name = createdUser.Name,
                    Phone = createdUser.Phone,
                    Address = createdUser.Address
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var user = await _userRepository.LoginAsync(loginDto.Username, loginDto.Password);

            if (user == null)
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid username or password"
                });

            // Generate JWT token
            var token = _tokenService.CreateToken(user);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                User = new UserDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Name = user.Name,
                    Phone = user.Phone,
                    Address = user.Address
                }
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(new UserDto
            {
                UserId = user.UserId,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Name = user.Name,
                Phone = user.Phone,
                Address = user.Address
            });
        }

        [HttpPut("update")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto updateProfileDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            // Check if email is being changed and if it's already taken
            if (!string.IsNullOrEmpty(updateProfileDto.Email) &&
                updateProfileDto.Email != user.Email &&
                await _userRepository.EmailExistsAsync(updateProfileDto.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            // Update user properties if provided
            if (!string.IsNullOrEmpty(updateProfileDto.Email))
                user.Email = updateProfileDto.Email;

            if (!string.IsNullOrEmpty(updateProfileDto.Name))
                user.Name = updateProfileDto.Name;

            if (!string.IsNullOrEmpty(updateProfileDto.Phone))
                user.Phone = updateProfileDto.Phone;

            if (updateProfileDto.Address != null) // Allow clearing address by setting to empty string
                user.Address = updateProfileDto.Address;

            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userRepository.UpdateUserAsync(user);

            if (!result)
                return BadRequest(new { message = "Failed to update profile" });

            return Ok(new
            {
                success = true,
                message = "Profile updated successfully",
                user = new UserDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Name = user.Name,
                    Phone = user.Phone,
                    Address = user.Address
                }
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            var user = await _userRepository.GetByEmailAsync(resetPasswordDto.Email);

            if (user == null)
                return Ok(new { message = "If your email is registered, you will receive a password reset link" });

            // In a real application, you would:
            // 1. Generate a password reset token
            // 2. Create a reset link with the token
            // 3. Send an email with the reset link
            // 4. Create an endpoint to handle the reset link

            // For this demo, we'll just return a success message
            return Ok(new
            {
                success = true,
                message = "Password reset instructions sent to your email",
                note = "In a real application, an email would be sent to the user"
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            var result = await _userRepository.ChangePasswordAsync(
                userId,
                changePasswordDto.CurrentPassword,
                changePasswordDto.NewPassword);

            if (!result)
                return BadRequest(new { message = "Current password is incorrect or failed to change password" });

            return Ok(new { success = true, message = "Password changed successfully" });
        }

        [HttpPost("admin/create-staff")]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<IActionResult> CreateStaffUser(CreateStaffDto createStaffDto)
        {
            // Validate role
            var allowedRoles = new[] { "admin", "service_agent", "mechanic", "finance_officer" };
            if (!Array.Exists(allowedRoles, role => role == createStaffDto.Role))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid role. Allowed roles: admin, service_agent, mechanic, finance_officer"
                });
            }

            // Check if username or email already exists
            if (await _userRepository.UserExistsAsync(createStaffDto.Username))
                return BadRequest(new { success = false, message = "Username already exists" });

            if (await _userRepository.EmailExistsAsync(createStaffDto.Email))
                return BadRequest(new { success = false, message = "Email already exists" });

            // Create user object
            var user = new User
            {
                Username = createStaffDto.Username,
                Email = createStaffDto.Email,
                Role = createStaffDto.Role,
                Name = createStaffDto.Name,
                Phone = createStaffDto.Phone,
                Address = createStaffDto.Address,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Register the user
            var createdUser = await _userRepository.RegisterAsync(user, createStaffDto.Password);

            if (createdUser == null)
                return BadRequest(new { success = false, message = "Failed to create staff user" });

            // If creating a mechanic, initialize performance record
            if (createdUser.Role == "mechanic")
            {
                // Add code to initialize MechanicsPerformance record
            }

            return Ok(new
            {
                success = true,
                message = "Staff user created successfully",
                user = new UserDto
                {
                    UserId = createdUser.UserId,
                    Username = createdUser.Username,
                    Email = createdUser.Email,
                    Role = createdUser.Role,
                    Name = createdUser.Name,
                    Phone = createdUser.Phone,
                    Address = createdUser.Address
                }
            });
        }
    }
}