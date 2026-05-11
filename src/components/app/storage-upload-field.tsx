"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type StorageUploadFieldProps = {
  bucket: "clinic-assets" | "patient-files" | "lab-reports";
  clinicId?: string;
  name: string;
  label: string;
  folder: string;
  accept?: string;
  defaultValue?: string | null;
  publicUrl?: boolean;
};

export function StorageUploadField({
  bucket,
  clinicId,
  name,
  label,
  folder,
  accept,
  defaultValue,
  publicUrl = false,
}: StorageUploadFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(file: File) {
    if (!clinicId) {
      toast.error("Clinic context is not available yet.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `${clinicId}/${folder}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast.error(error.message);
      setIsUploading(false);
      return;
    }

    if (publicUrl) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setValue(data.publicUrl);
    } else {
      setValue(path);
    }
    toast.success("File uploaded.");
    setIsUploading(false);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={`${name}-file`}>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          id={`${name}-file`}
          type="file"
          accept={accept}
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <Button type="button" variant="outline" disabled={isUploading}>
          <UploadCloud className="mr-2 size-4" />
          {isUploading ? "Uploading" : "Upload"}
        </Button>
      </div>
      <input type="hidden" name={name} value={value} />
      {value ? <p className="truncate text-xs text-muted-foreground">{value}</p> : null}
    </div>
  );
}
