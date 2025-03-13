"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaMobile, 
  FaLock, 
  FaArrowLeft, 
  FaHospital, 
  FaEnvelope,
  FaWhatsapp,
  FaSms
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: Mobile/Email entry, 2: OTP verification
  const [formData, setFormData] = useState({
    mobile: "",
    email: ""
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contactMethod, setContactMethod] = useState('sms'); // 'sms', 'whatsapp', or 'email'
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (contactMethod === 'sms' || contactMethod === 'whatsapp') {
      if (!formData.mobile || formData.mobile.length < 10) {
        toast.error("Please enter a valid phone number");
        return;
      }
    } else if (contactMethod === 'email') {
      if (!formData.email || !formData.email.includes('@')) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Determine the endpoint based on contact method
      let endpoint;
      let requestData;
      
      switch(contactMethod) {
        case 'email':
          endpoint = '/api/auth/email-otp';
          requestData = {
            email: formData.email,
            isLogin: true
          };
          break;
        case 'whatsapp':
          endpoint = '/api/auth/whatsapp-otp';
          requestData = {
            mobile: formData.mobile,
            userName: "User", // Generic name for login
            isLogin: true
          };
          break;
        default: // SMS
          endpoint = '/api/auth/login';
          requestData = {
            mobile: formData.mobile,
            isLogin: true
          };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (res.ok) {
        let successMessage = "";
        
        switch(contactMethod) {
          case 'email':
            successMessage = `OTP sent to your email address (${formData.email})`;
            break;
          case 'whatsapp':
            successMessage = `OTP sent to your WhatsApp (${formData.mobile})`;
            break;
          default:
            successMessage = `OTP sent to your mobile number (${formData.mobile})`;
        }
        
        toast.success(successMessage);
        setStep(2);
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      // Determine the verification endpoint based on contact method
      let endpoint;
      let requestData;
      
      switch(contactMethod) {
        case 'email':
          endpoint = '/api/auth/verify-email';
          requestData = {
            email: formData.email,
            otp,
            isRegistration: false
          };
          break;
        case 'whatsapp':
          endpoint = '/api/auth/verify-whatsapp';
          requestData = {
            mobile: formData.mobile,
            otp,
            isRegistration: false
          };
          break;
        default: // SMS
          endpoint = '/api/auth/verify';
          requestData = {
            mobile: formData.mobile,
            otp,
            isRegistration: false
          };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (res.ok) {
        const { token, role } = data;

        // Store token in localStorage
        localStorage.setItem("token", token);

        // Redirect based on role
        if (role === "admin") {
          router.push("/dashboard/admin");
        } else if (role === "doctor") {
          router.push("/dashboard/doctor");
        } else {
          router.push("/dashboard/patient");
        }

        toast.success("Login successful");
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get contact method display text
  const getContactMethodText = () => {
    switch(contactMethod) {
      case 'email':
        return `email address (${formData.email})`;
      case 'whatsapp':
        return `WhatsApp number (${formData.mobile})`;
      default:
        return `mobile number (${formData.mobile})`;
    }
  };

  // Function to get contact method icon for OTP screen
  const getContactMethodIcon = () => {
    switch(contactMethod) {
      case 'email':
        return <FaEnvelope className="text-primary-500 mr-1" />;
      case 'whatsapp':
        return <FaWhatsapp className="text-green-500 mr-1" />;
      default:
        return <FaMobile className="text-primary-500 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 to-primary-500 py-6 px-6">
          <div className="flex items-center justify-center mb-4">
            <FaHospital className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            Dr. Imran's Healthcare
          </h2>
          <p className="text-primary-100 text-center text-sm">
            Healthcare & Diagnostic Centre
          </p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Login Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all ${
                      contactMethod === 'sms' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                    onClick={() => setContactMethod('sms')}
                  >
                    <FaSms className={`h-6 w-6 mb-2 ${contactMethod === 'sms' ? 'text-primary-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">SMS</span>
                  </div>
                  <div 
                    className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all ${
                      contactMethod === 'whatsapp' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                    onClick={() => setContactMethod('whatsapp')}
                  >
                    <FaWhatsapp className={`h-6 w-6 mb-2 ${contactMethod === 'whatsapp' ? 'text-primary-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </div>
                  <div 
                    className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all ${
                      contactMethod === 'email' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                    onClick={() => setContactMethod('email')}
                  >
                    <FaEnvelope className={`h-6 w-6 mb-2 ${contactMethod === 'email' ? 'text-primary-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                </div>
              </div>

              {contactMethod === 'email' ? (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mobile">
                    Phone Number {contactMethod === 'whatsapp' && '(WhatsApp)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {contactMethod === 'whatsapp' ? (
                        <FaWhatsapp className="h-5 w-5 text-primary-500" />
                      ) : (
                        <FaMobile className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile || ''}
                      onChange={handleChange}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={`Enter your ${contactMethod === 'whatsapp' ? 'WhatsApp' : 'mobile'} number`}
                      required
                    />
                    {contactMethod === 'whatsapp' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Include country code (e.g., +1 for US)
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 ease-in-out"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>

              <div className="text-center text-sm">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary-600 hover:text-primary-800 font-semibold"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center text-primary-600 hover:text-primary-800"
                >
                  <FaArrowLeft className="mr-1" /> Back
                </button>
              </div>

              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  We've sent a 6-digit OTP to your {getContactMethodText()}
                </p>
                <div className="mt-2 flex items-center justify-center text-sm">
                  {getContactMethodIcon()}
                  <span>
                    {contactMethod === 'email' 
                      ? 'Check your email inbox (and spam folder)' 
                      : contactMethod === 'whatsapp' 
                        ? 'Check your WhatsApp messages' 
                        : 'Check your SMS messages'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  For testing purposes, use OTP: 123456
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="otp"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Enter OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-primary-500" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 ease-in-out"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
