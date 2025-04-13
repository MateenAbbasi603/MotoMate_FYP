// Models/DTOs/AuthDTOs.cs
using System.ComponentModel.DataAnnotations;

namespace fyp_motomate.Models.DTOs
{
    public class RegisterDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Username { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; }

          
        [StringLength(255)]
        public string imgUrl { get; set; }


        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Role { get; set; } = "customer";

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(20)]
        public string Phone { get; set; }

        [StringLength(255)]
        public string Address { get; set; }
    }

    public class LoginDto
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class UserDto
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }

        public string imgUrl { get; set; }
    }

    public class UpdateProfileDto
    {
        [EmailAddress]
        public string Email { get; set; }

        public string Name { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }

        public string imgUrl { get; set; }
    }

    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; set; }

        [Required]
        [Compare("NewPassword")]
        public string ConfirmNewPassword { get; set; }
    }

    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Token { get; set; }
        public UserDto User { get; set; }
    }

    public class CreateStaffDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Username { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Role { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(20)]
        public string Phone { get; set; }

        [StringLength(255)]
        public string Address { get; set; }
    }
}