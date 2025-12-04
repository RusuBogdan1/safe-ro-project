import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_REGIONS } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const HAZARD_TYPES = [
  { value: "flood", label: "Flood" },
  { value: "fire", label: "Fire" },
  { value: "vegetation", label: "Vegetation" },
  { value: "hybrid", label: "Hybrid" },
];

export function AnnouncementCreationForm({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    region_id: "",
    hazard_type: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.region_id || !formData.hazard_type || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const selectedRegion = MOCK_REGIONS.find(r => r.id === formData.region_id);
    if (!selectedRegion) {
      toast.error("Invalid region selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("volunteer_announcements").insert({
        region_id: formData.region_id,
        region_name: selectedRegion.displayName,
        hazard_type: formData.hazard_type,
        message: formData.message.trim(),
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Volunteer request posted!");
      setFormData({ region_id: "", hazard_type: "", message: "" });
      setIsOpen(false);
      onCreated?.();
    } catch (error: any) {
      if (error.message?.includes("row-level security")) {
        toast.error("You don't have permission to create announcements");
      } else {
        toast.error("Failed to create announcement");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        New Request
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card/50 rounded-lg border border-border space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select
            value={formData.region_id}
            onValueChange={(value) => setFormData({ ...formData, region_id: value })}
          >
            <SelectTrigger id="region" className="bg-secondary">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_REGIONS.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hazard">Hazard Type</Label>
          <Select
            value={formData.hazard_type}
            onValueChange={(value) => setFormData({ ...formData, hazard_type: value })}
          >
            <SelectTrigger id="hazard" className="bg-secondary">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {HAZARD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Describe the volunteer request..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="bg-secondary min-h-[80px]"
          maxLength={500}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="hero"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Request"
          )}
        </Button>
      </div>
    </form>
  );
}