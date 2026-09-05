import React, { useEffect, useState } from "react";
import {
  X,
  Upload,
  Plus,
  File,
  Minus,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormikProps } from "formik";
import { iClientOnboardForm } from "@/pages/client/ClientsPage";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import API_CONFIG from "@/lib/apiConfig";
import { useTheme } from "@/hooks/useTheme";
import { MAX_FILE_SIZE } from "@/utils/constants";

interface OnboardClientModalProps {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  formik: FormikProps<iClientOnboardForm>;
}

type ClientType = "EXISTING" | "POTENTIAL";

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`flex items-start gap-2 text-sm mt-2 px-3 py-2 rounded-md border ${
        theme === "dark"
          ? "text-red-400 bg-red-500/5 border-red-500/20"
          : "text-red-600 bg-red-50 border-red-200"
      }`}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

const OnboardClientModal: React.FC<OnboardClientModalProps> = ({
  open,
  onOpenChange,
  formik,
  isSubmitting,
}) => {
  const { theme } = useTheme();
  const [clientType, setClientType] = useState<ClientType>("EXISTING");
  const [attachedFiles, setAttachedFiles] = useState<any>(null);
  const [addNewInventors, setAddNewInventors] = useState([
    { id: Date.now(), value: "" },
  ]);

  const {
    values,
    setValues,
    handleBlur,
    handleChange,
    handleSubmit,
    errors,
    touched,
    setFieldValue,
    isValid,
    resetForm,
  } = formik;

  // No need to initialize newAdminEmail in formik values, as it's a local state

  const {
    mutate,
    data: fileUploadData,
    isPending: isUploadingLogo,
    isSuccess: fileUploadSucess,
    error: fileUploadError,
  } = useMutation({
    mutationKey: ["upload_file"],
    mutationFn: async (input: { file: File }) => {
      try {
        const { s3Upload } = await import("@/lib/api-service/s3Upload");
        const fileRecord = await s3Upload(input.file, "image");
        return { message: "File uploaded successfully", data: [fileRecord] };
      } catch (error: any) {
        console.error("upload file Error", error);
        toast.error(error?.response?.data?.message || "Failed to upload file!");
      }
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if(file?.size >= MAX_FILE_SIZE) {
        toast.error("File must be less than 1GB");
        return;
      }
      mutate({ file });
    }
  };

  useEffect(() => {
    if (fileUploadData) {
      setValues((prev) => ({ ...prev, logo: fileUploadData?.data?.[0] }));
    }
  }, [fileUploadData, setValues]);

  const { mutate: deleteFile } = useMutation({
    mutationKey: ["delete_file"],
    mutationFn: async (id: string) => {
      try {
        const response = await API_CONFIG.delete(`/api/v1/remove-file/${id}`);

        if (response.status === 200) {
          setValues((prev) => ({ ...prev, logo: "" }));
        }
      } catch (error) {
        console.error("file upload error", error);
        toast.error(error?.response?.message || "Failed to upload file");
      }
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if(e?.target?.files?.[0]?.size >= MAX_FILE_SIZE) {
        toast.error("File must be less than 1GB");
        return;
      }
      setAttachedFiles(e?.target?.files?.[0]);
      setValues((prev) => ({
        ...prev,
        patent_file: e?.target?.files?.[0],
      }));
    }
  };

  const handleAddNewInventor = () => {
    setAddNewInventors((prev) => [...prev, { id: Date.now(), value: "" }]);
  };

  const removeInventor = (id: string) => {
    setAddNewInventors((prev) => {
      const updated = prev.filter((inv) => inv.id?.toString() !== id);
      setFieldValue(
        "admin_users",
        updated.map((inv) => inv.value).filter((v) => v.trim() !== ""),
      );
      return updated;
    });
  };

  const handleInventorChange = (id: string, value: string) => {
    setAddNewInventors((prev) => {
      const updated = prev.map((inv) =>
        inv.id?.toString() === id ? { ...inv, value } : inv,
      );
      setFieldValue(
        "admin_users",
        updated.map((inv) => inv.value).filter((v) => v.trim() !== ""),
      );
      return updated;
    });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-full overflow-y-auto border-pl-border bg-pl-bg text-pl-ink sm:max-w-lg"><DialogHeader><DialogTitle>Create a client workspace</DialogTitle><DialogDescription>Create the organization first. Its record will guide you through domain, ownership, people and portfolio setup.</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-5"><div><Label htmlFor="client-name">Client name</Label><Input id="client-name" name="name" autoFocus value={values.name} onChange={handleChange} onBlur={handleBlur} className="mt-2 h-9 border-pl-border" aria-invalid={!!touched.name && !!errors.name}/>{touched.name && errors.name && <p role="alert" className="mt-2 text-sm text-pl-red-text">{String(errors.name)}</p>}</div>{formik.status && <p role="alert" className="text-sm text-pl-red-text">{formik.status}</p>}<DialogFooter><Button type="button" size="sm" variant="outline" disabled={isSubmitting} onClick={()=>onOpenChange(false)}>Cancel</Button><Button type="submit" size="sm" disabled={isSubmitting || !values.name.trim()} className="bg-pl-brand text-pl-ink hover:bg-pl-brand-deep">{isSubmitting?"Creating client…":"Create client"}</Button></DialogFooter></form></DialogContent></Dialog>;
};
export default OnboardClientModal;
