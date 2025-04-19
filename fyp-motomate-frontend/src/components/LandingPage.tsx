"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Car, Phone, Star, Calendar, Clock, MessageSquare, ArrowRight, Wrench, LogIn } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from 'framer-motion';
import Image from 'next/image';


interface TestimonialType {
    name: string;
    role: string;
    comment: string;
    rating: number;
    image?: string;
}

interface FeatureItem {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface StatItem {
    value: string;
    label: string;
}

const LandingPage: React.FC = () => {
    const router = useRouter();
    const [activeTestimonial, setActiveTestimonial] = useState<number>(0);

    // Sample testimonials
    const testimonials: TestimonialType[] = [
        {
            name: "Aamir Khan",
            role: "Tesla Model 3 Owner",
            comment: "MotoMate completely changed how I manage my car's maintenance. The app notifications for service reminders are incredibly helpful.",
            rating: 5,
            image: "/testimonials/aamir.jpg"
        },
        {
            name: "Sania Mirza",
            role: "BMW M4 Owner",
            comment: "The real-time updates during my car service were amazing. I could see exactly what was happening without having to call repeatedly.",
            rating: 5,
            image: "/testimonials/sania.jpg"
        },
        {
            name: "Virat Kohli",
            role: "Mercedes AMG Owner",
            comment: "Booking appointments through the app is so convenient. I love how I can choose my preferred mechanic based on their expertise.",
            rating: 4,
            image: "/testimonials/virat.jpg"
        },
    ];

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    // Feature items array
    const featureItems: FeatureItem[] = [
        {
            icon: <Calendar className="w-12 h-12 text-red-500" />,
            title: "Easy Scheduling",
            description: "Book appointments online with real-time availability of mechanics and service slots."
        },
        {
            icon: <Car className="w-12 h-12 text-red-500" />,
            title: "Vehicle Tracking",
            description: "Complete service history for each vehicle, accessible to both customers and workshop staff."
        },
        {
            icon: <Clock className="w-12 h-12 text-red-500" />,
            title: "Real-time Updates",
            description: "Customers receive live notifications about service progress and completion."
        },
        {
            icon: <Wrench className="w-12 h-12 text-red-500" />,
            title: "Mechanic Assignment",
            description: "Automatic job assignment based on mechanic expertise and availability."
        },
        {
            icon: <MessageSquare className="w-12 h-12 text-red-500" />,
            title: "Customer Feedback",
            description: "Structured collection of reviews and ratings to improve service quality."
        },
        {
            icon: <ArrowRight className="w-12 h-12 text-red-500" />,
            title: "Automated Reminders",
            description: "Send maintenance reminders and follow-ups to increase customer retention."
        }
    ];

    // Stats items array
    const statItems: StatItem[] = [
        { value: "2500+", label: "Workshops" },
        { value: "50,000+", label: "Customers" },
        { value: "120,000+", label: "Services Completed" },
        { value: "98%", label: "Satisfaction Rate" }
    ];

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = "https://images.unsplash.com/photo-1638241211470-13ca212f0461?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    };

    // Animation variants for framer-motion
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6
            }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const scaleIn = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    const itemVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 10
            }
        }
    };

    const pulseAnimation = {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse" as const
        }
    };

    const handleLogin = () => {
        router.push('/login');
    };

    return (
        <div className="min-h-screen overflow-x-hidden font-sans">
           
            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center text-white bg-gradient-to-r from-red-700 to-red-950 overflow-hidden">

                
                <motion.div
                            
                            initial={{ opacity: 0, x: -100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 1 }}
                            
                        >
                            <Image width={500} height={500} src="/logo.png" alt="Logo" className='h-full w-full' />
                        </motion.div>

                        {/* Background with parallax effect */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center"></div>
                </motion.div>
                
                
                <div className="container mx-auto px-4 z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.h1
                            variants={fadeIn}
                            className="text-5xl md:text-7xl font-bold mb-6"
                        >
                            Welcome to <span className="text-red-300">MotoMate</span>
                        </motion.h1>

                        <motion.div
                            
                            initial={{ opacity: 0, x: -100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 1 }}
                            className="absolute right-0.5 bottom-10 lg:bottom-10 w-3/4 lg:w-1/3 z-10"
                        >
                            <Image width={1000} height={1000} src="/hero.webp" alt="Luxury Sports Car" className="w-full h-auto" />
                        </motion.div>


                        <motion.p
                            variants={fadeIn}
                            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
                        >
                            Revolutionizing automotive service management for workshops and customers alike.
                        </motion.p>

                        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    onClick={handleLogin}
                                    className="bg-red-500 hover:bg-blue-600 text-white rounded-full px-8 flex items-center"
                                >
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Login
                                </Button>
                            </motion.div>
                            
                           
                        </motion.div>
                    </motion.div>
                </div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
                >
                    <ChevronDown className="w-10 h-10" />
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4 text-red-800">Why Choose MotoMate?</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Our automotive management system streamlines operations for workshops while providing customers with transparency and convenience.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                        {featureItems.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={scaleIn}
                                whileHover={{
                                    y: -10,
                                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                                }}
                                className="bg-white p-8 rounded-xl shadow-lg transition-all"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <motion.div
                                        animate={pulseAnimation}
                                        className="mb-5 p-3 bg-gray-50 rounded-full"
                                    >
                                        {feature.icon}
                                    </motion.div>
                                    <h3 className="text-xl font-bold mb-3 text-red-800">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* About Us Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-10"
                        >
                            <h2 className="text-4xl font-bold mb-6 text-red-800">About MotoMate</h2>
                            <p className="text-lg text-gray-600 mb-6">
                                MotoMate was founded with a simple mission: to streamline the automotive service experience
                                for both workshops and customers. Our founders, with decades of experience in the automotive industry,
                                recognized the inefficiencies in traditional workshop management systems.
                            </p>
                            <p className="text-lg text-gray-600 mb-6">
                                Developed by Mashal Fida Khan and Mateen Ahmed Abbasi under the guidance of Sir Fahad Feroz at
                                Karachi Institute of Economics and Technology (KIET), MotoMate represents the future of
                                automotive service management.
                            </p>
                            <p className="text-lg text-gray-600">
                                We are committed to continuously improving our platform based on user feedback and industry trends,
                                ensuring that MotoMate remains at the cutting edge of automotive service technology.
                            </p>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-8"
                            >
                                <Button className="bg-red-500 hover:bg-blue-600 text-white rounded-full px-8">
                                    Learn More About Our Journey
                                </Button>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={scaleIn}
                            className="lg:w-1/2"
                        >
                            <div className="relative rounded-xl overflow-hidden shadow-2xl">
                                <img
                                    src="/workshop.jpg"
                                    alt="Automotive Workshop"
                                    className="w-full h-auto"
                                    onError={handleImageError}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                                    <div className="p-6 text-white">
                                        <p className="text-xl font-semibold">Committed to Excellence</p>
                                        <p>Providing top-tier service management solutions</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4 text-red-800">What Our Users Say</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Hear from workshop owners and customers who have transformed their automotive service experience with MotoMate.
                        </p>
                    </motion.div>

                    <div className="relative max-w-4xl mx-auto">
                        <div className="h-96 relative overflow-hidden">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{
                                        opacity: activeTestimonial === index ? 1 : 0,
                                        scale: activeTestimonial === index ? 1 : 0.9,
                                        x: `${(index - activeTestimonial) * 100}%`,
                                        zIndex: activeTestimonial === index ? 10 : 0
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0 flex flex-col items-center justify-center p-6"
                                >
                                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
                                        <div className="flex items-center mb-6">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-6 h-6 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-gray-700 text-lg italic mb-6">&quot;{testimonial.comment}&quot;</p>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-red-700 font-bold text-xl mr-4">
                                                {testimonial.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-red-800">{testimonial.name}</h4>
                                                <p className="text-gray-600">{testimonial.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-center mt-6 space-x-2">
                            {testimonials.map((_, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => setActiveTestimonial(index)}
                                    className={`w-3 h-3 rounded-full ${activeTestimonial === index ? 'bg-red-500' : 'bg-gray-300'
                                        }`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-red-800 text-white">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"
                    >
                        {statItems.map((stat, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariant}
                            >
                                <motion.h3
                                    className="text-4xl lg:text-5xl font-bold mb-2"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{
                                        opacity: 1,
                                        scale: 1,
                                        transition: {
                                            type: "spring",
                                            stiffness: 50,
                                            delay: index * 0.1
                                        }
                                    }}
                                    viewport={{ once: true }}
                                >
                                    {stat.value}
                                </motion.h3>
                                <p className="text-red-200">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-10"
                        >
                            <h2 className="text-4xl font-bold mb-6 text-red-800">Get In Touch</h2>
                            <p className="text-lg text-gray-600 mb-8">
                                Have questions about MotoMate or want to schedule a demo?
                                Reach out to our team and we will get back to you as soon as possible.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <div className="mt-1 bg-blue-100 p-3 rounded-full mr-4">
                                        <Phone className="w-5 h-5 text-red-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-800">Phone</h3>
                                        <p className="text-gray-600">+92-336-1800485</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="mt-1 bg-blue-100 p-3 rounded-full mr-4">
                                        <MessageSquare className="w-5 h-5 text-red-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-800">Email</h3>
                                        <p className="text-gray-600">MotoM22@gmail.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="mt-1 bg-blue-100 p-3 rounded-full mr-4">
                                        <Car className="w-5 h-5 text-red-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-800">Address</h3>
                                        <p className="text-gray-600">C43 – Shahra e Faisal, Karachi</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={scaleIn}
                            className="lg:w-1/2"
                        >
                            <form className="bg-white p-8 rounded-xl shadow-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <Input id="name" placeholder="Your name" className="w-full" />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <Input id="email" type="email" placeholder="Your email" className="w-full" />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject
                                    </label>
                                    <Input id="subject" placeholder="How can we help?" className="w-full" />
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                        Message
                                    </label>
                                    <Textarea
                                        id="message"
                                        placeholder="Your message"
                                        className="w-full min-h-[150px]"
                                    />
                                </div>

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-3">
                                        Send Message
                                    </Button>
                                </motion.div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-red-700 to-red-950-900 text-white">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                    >
                        <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Automotive Service?</h2>
                        <p className="text-xl max-w-3xl mx-auto mb-8">
                            Join the thousands of workshops already using MotoMate to streamline operations and delight customers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    className="bg-white text-red-800 hover:bg-red-50 rounded-full px-8"
                                >
                                    Schedule a Demo
                                </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleLogin}
                                    className="border-white text-white hover:bg-white hover:text-red-800 rounded-full px-8 flex items-center"
                                >
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Get Started Now
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">MotoMate</h3>
                            <p className="text-gray-400 mb-4">
                                Revolutionizing automotive service management for workshops and customers alike.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-white">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Services</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Services</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white">For Workshops</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">For Customers</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">API Integration</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
                        <p>&copy; {new Date().getFullYear()} MotoMate Auto Services. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;