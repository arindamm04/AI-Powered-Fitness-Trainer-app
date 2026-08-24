import Link from "next/link";
import { ZapIcon, Code, Send, Mail } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="border-t border-border bg-background/30 backdrop-blur-sm">
            <div className="container mx-auto max-w-6xl px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="p-1 bg-primary/10 rounded">
                                <ZapIcon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-lg font-bold font-mono">
                                Next<span className="text-primary">fit</span>.ai
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            AI-powered personalized fitness and health solutions
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/generate-program" className="text-muted-foreground hover:text-primary transition-colors">
                                    Generate Program
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                                    Pricing
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                                    Careers
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Connect</h3>
                        <div className="flex gap-3">
                            <a href="#" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                <Code className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                <Send className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

                {/* Bottom */}
                <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
                    <p>&copy; 2024 Nextfit.ai. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <Link href="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/" className="hover:text-primary transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
