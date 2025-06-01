"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search, Wrench, Package, Calendar, DollarSign, Building, Hash } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ToolInstance {
    instanceId: number;
    serialNumber: string;
    createdAt: string;
}

interface Tool {
    toolId: number;
    toolName: string;
    toolType: string;
    condition: string;
    price: number;
    vendorName: string;
    purchaseDate: string;
    totalQuantity: number;
    activeQuantity: number;
    inactiveQuantity: number;
    daysSincePurchase: number;
    instances: ToolInstance[];
}

interface ToolStats {
    totalTools: number;
    totalInstances: number;
    toolTypes: Array<{ toolType: string; count: number }>;
    conditionStats: Array<{ condition: string; count: number }>;
}

export default function MechanicToolsPage() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [stats, setStats] = useState<ToolStats | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchTools = async (search: string = "") => {
        try {
            const token = localStorage.getItem("token");
            const searchParam = search ? `?search=${encodeURIComponent(search)}` : "";
    
            const response = await fetch(`http://localhost:5177/api/Inventory/active${searchParam}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error("Failed to fetch tools");
            }
    
            const data = await response.json();
            console.log(data, 'Raw API Response');
            
            // Handle the $values structure from .NET serialization
            let toolsArray = [];
            if (data.tools && data.tools.$values) {
                toolsArray = data.tools.$values.map((tool: any) => ({
                    ...tool,
                    instances: tool.instances && tool.instances.$values ? tool.instances.$values : []
                }));
            } else if (Array.isArray(data.tools)) {
                toolsArray = data.tools;
            } else if (Array.isArray(data)) {
                toolsArray = data;
            }
            
            console.log('Processed tools:', toolsArray);
            setTools(toolsArray);
        } catch (err) {
            setError("Failed to load tools. Please try again.");
            console.error("Error fetching tools:", err);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
    
            const response = await fetch("http://localhost:5177/api/Inventory/stats", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error("Failed to fetch stats");
            }
    
            const data = await response.json();
            
            // Handle $values structure if present
            let processedStats = data.stats;
            if (processedStats) {
                if (processedStats.toolTypes && processedStats.toolTypes.$values) {
                    processedStats.toolTypes = processedStats.toolTypes.$values;
                }
                if (processedStats.conditionStats && processedStats.conditionStats.$values) {
                    processedStats.conditionStats = processedStats.conditionStats.$values;
                }
            }
            
            setStats(processedStats);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchTools(), fetchStats()]);
            setLoading(false);
        };

        loadData();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await fetchTools(searchTerm);
        setLoading(false);
    };

    const clearSearch = async () => {
        setSearchTerm("");
        setLoading(true);
        await fetchTools("");
        setLoading(false);
    };

    const getConditionColor = (condition: string) => {
        switch (condition.toLowerCase()) {
            case 'new':
            case 'excellent':
                return "bg-blue-100 text-blue-800 border-blue-200";
            case 'good':
                return "bg-green-100 text-green-800 border-green-200";
            case 'fair':
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'poor':
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>

                <Skeleton className="h-10 w-full max-w-md" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Active Tools Inventory</h1>
                <p className="text-muted-foreground">
                    Manage and view all active tools in the workshop inventory
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
                            <Package className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTools}</div>
                            <p className="text-xs text-muted-foreground">Active tool types</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
                            <Hash className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalInstances}</div>
                            <p className="text-xs text-muted-foreground">Individual tool pieces</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tool Categories</CardTitle>
                            <Wrench className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.toolTypes.length}</div>
                            <p className="text-xs text-muted-foreground">Different categories</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
                            <Building className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.toolTypes[0]?.toolType.substring(0, 10) || "N/A"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.toolTypes[0]?.count || 0} tools
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search tools by name, type, or vendor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            Search
                        </Button>
                        {searchTerm && (
                            <Button type="button" variant="outline" onClick={clearSearch}>
                                Clear
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tools Grid */}
            {!tools || tools.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Tools Found</h3>
                        <p className="text-muted-foreground">
                            {searchTerm
                                ? `No tools match your search for "${searchTerm}"`
                                : "There are no active tools in the inventory"
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.isArray(tools) && tools.map((tool) => (
                        <Card key={tool.toolId} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:shadow-xl">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                            {tool.toolName}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <Wrench className="h-3 w-3" />
                                            {tool.toolType}
                                        </CardDescription>
                                    </div>
                                    <Badge className={getConditionColor(tool.condition)} variant="outline">
                                        {tool.condition}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Quantities */}
                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{tool.activeQuantity}</div>
                                        <div className="text-xs text-muted-foreground">Active</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-500">{tool.totalQuantity}</div>
                                        <div className="text-xs text-muted-foreground">Total</div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <DollarSign className="h-3 w-3" />
                                            Price:
                                        </span>
                                        <span className="font-medium">{formatCurrency(tool.price)}</span>
                                    </div>

                                    {tool.vendorName && (
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Building className="h-3 w-3" />
                                                Vendor:
                                            </span>
                                            <span className="font-medium truncate ml-2">{tool.vendorName}</span>
                                        </div>
                                    )}

                                    {tool.purchaseDate && (
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                Purchased:
                                            </span>
                                            <span className="font-medium">{formatDate(tool.purchaseDate)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Active Instances */}
                                {tool.instances && Array.isArray(tool.instances) && tool.instances.length > 0 && (
                                    <div className="pt-3 border-t">
                                        <div className="text-xs font-medium text-muted-foreground mb-2">
                                            Active Serial Numbers:
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {tool.instances.slice(0, 3).map((instance) => (
                                                <Badge key={instance.instanceId} variant="secondary" className="text-xs">
                                                    {instance.serialNumber}
                                                </Badge>
                                            ))}
                                            {tool.instances.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{tool.instances.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}