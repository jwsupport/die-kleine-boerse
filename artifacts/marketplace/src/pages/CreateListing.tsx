import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateListing } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Furniture", "Clothing", "Electronics", "Art", "Books", "Other"];

export function CreateListing() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const createListing = useCreateListing();
  const { user, isAuthenticated, login } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    isNegotiable: false,
    category: "",
    location: "",
    description: "",
    imageUrls: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      login();
      return;
    }
    
    if (!formData.title || !formData.price || !formData.category || !formData.location) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    createListing.mutate({
      data: {
        sellerId: user.id,
        title: formData.title,
        price: Number(formData.price),
        isNegotiable: formData.isNegotiable,
        category: formData.category,
        location: formData.location,
        description: formData.description || null,
        imageUrls: formData.imageUrls ? formData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : []
      }
    }, {
      onSuccess: (newListing) => {
        toast({ title: "Success", description: "Listing created successfully." });
        setLocation(`/listings/${newListing.id}`);
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-medium text-slate-900 mb-2">Sell an item</h1>
          <p className="text-slate-500">List your item for sale in the local marketplace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6 bg-white p-6 md:p-8 rounded-sm border border-slate-100 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="E.g., Mid-century modern armchair" 
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className="focus-visible:ring-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input 
                  id="price" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={formData.price}
                  onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                  className="focus-visible:ring-slate-300"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <Switch 
                  id="negotiable" 
                  checked={formData.isNegotiable}
                  onCheckedChange={checked => setFormData(p => ({ ...p, isNegotiable: checked }))}
                />
                <Label htmlFor="negotiable" className="font-normal cursor-pointer">Price is negotiable (VB)</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger id="category" className="focus-visible:ring-slate-300">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input 
                  id="location" 
                  placeholder="E.g., Downtown, SF" 
                  value={formData.location}
                  onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                  className="focus-visible:ring-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the condition, dimensions, and history of the item." 
                className="min-h-[120px] focus-visible:ring-slate-300"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <Input 
                id="images" 
                placeholder="Comma-separated image URLs" 
                value={formData.imageUrls}
                onChange={e => setFormData(p => ({ ...p, imageUrls: e.target.value }))}
                className="focus-visible:ring-slate-300"
              />
              <p className="text-xs text-slate-500">Provide direct links to images, separated by commas.</p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => setLocation('/')} className="rounded-sm">Cancel</Button>
            <Button type="submit" className="rounded-sm px-8" disabled={createListing.isPending}>
              {createListing.isPending ? 'Publishing...' : 'Publish Listing'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
