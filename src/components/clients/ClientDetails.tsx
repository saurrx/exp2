import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Edit,
  Check,
  X,
  Minus,
  Plus,
  Mail,
  Users,
  FileText,
  UserX,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "react-router-dom";
import _, { template } from "lodash";
import API_CONFIG from "@/lib/apiConfig";
import { getClientLogoSrc } from "@/lib/clientBranding";
import { useFileUpload } from "@/lib/api-service/commonApi.service";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";

type ClientDetailsProps = {
  clientData: any;
  clientId: string;
  refetchClientData: any;
  isEditMode?: boolean;
  onSaveComplete?: () => void;
  onSaveError?: (message: string | null) => void;
  onCancel?: () => void;
};

export type ClientDetailsRef = {
  saveChanges: () => Promise<void>;
};

const ClientDetails = forwardRef<ClientDetailsRef, ClientDetailsProps>(
  (
    {
      clientData,
      clientId,
      refetchClientData,
      isEditMode = false,
      onSaveComplete,
      onSaveError,
      onCancel,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [tempLogoFile, setTempLogoFile] = useState<any>(null);
    const [validationErrors, setValidationErrors] = useState<any>({});
    const [formData, setFormData] = useState<any>({
      name: "",
      allowed_domain: "",
      about: "",
      status: "",
      admin_users: [],
      logo: null,
    });
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const setSaveError = (message: string | null) => onSaveError?.(message);

    // Initialize form data when clientData changes or edit mode is enabled
    useEffect(() => {
      if (clientData && isEditMode) {
        setFormData({
          name: clientData?.name || "",
          allowed_domain: clientData?.allowed_domain || "",
          about: clientData?.about || "",
          admin_users:
            clientData?.User?.filter((u: any) => u?.role === "LEGAL_COUNSEL")?.map(
              (u: any) => u?.email
            ) || [],
          logo: null,
        });
        setTempLogoFile(null);
        setNewAdminEmail("");
        setValidationErrors({});
      }
    }, [clientData, isEditMode]);

    const {
      isPending: isFileUploading,
      data: fileUploadData,
      isSuccess: logoUploadSucess,
      mutate: fileUploadMutate,
    } = useFileUpload();

    const { mutate: personalInfoUpdate, isPending: isUpdating } = useMutation({
      mutationKey: ["update_client_personal_info", clientId],
      mutationFn: async (data: any) => {
        try {
          const response = await API_CONFIG.put(
            `/api/v1/clients/personal-info/${clientId}`,
            data
          );

          if (response?.status === 200) {
            return response?.data;
          }
        } catch (error) {
          console.error("Error updating client personal info:", error);
          throw error;
        }
      },
    });

    // Expose saveChanges method via ref
    useImperativeHandle(ref, () => ({
      saveChanges: async () => {
        setSaveError(null);
        // Validate all fields
        const errors: any = {};

        // Validate name
        if (!formData.name?.trim()) {
          errors.name = "Client name is required";
        }

        // Validate allowed domain
        const domainError = validateAllowedDomain(formData.allowed_domain);
        if (domainError) {
          errors.allowed_domain = domainError;
        }

        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          toast.error("Please fix validation errors before saving");
          return;
        }

        try {
          // Prepare update data
          const updateData: any = {
            name: formData.name,
            allowed_domain: formData.allowed_domain,
            about: formData.about,
            admin_users: formData.admin_users,
          };

          // If logo was changed, include it
          if (tempLogoFile?.id) {
            updateData.logo = tempLogoFile.id;
          }

          // Save all changes together
          await new Promise<void>((resolve, reject) => {
            personalInfoUpdate(updateData, {
              onSuccess: () => {
                refetchClientData();
                resolve();
              },
              onError: (error: any) => {
                reject(error);
              },
            });
          });

          if (onSaveComplete) {
            onSaveComplete();
          }
        } catch (error: any) {
          setSaveError(error?.response?.data?.message || "Client information could not be saved. Your changes are still here.");
          // The parent keeps one persistent recovery message by the save controls.
        }
      },
    }));

    useEffect(() => {
      if (fileUploadData?.data?.length > 0) {
        setTempLogoFile(fileUploadData?.data?.[0]);
      }
    }, [fileUploadData]);

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Email copied to clipboard");
    };

    const handleCancel = () => {
      if (onCancel) {
        onCancel();
      }
      // Reset form data
      if (clientData) {
        setFormData({
          name: clientData?.name || "",
          allowed_domain: clientData?.allowed_domain || "",
          about: clientData?.about || "",
          admin_users:
            clientData?.User?.filter((u: any) => u?.role === "LEGAL_COUNSEL")?.map(
              (u: any) => u?.email
            ) || [],
          logo: null,
        });
      }
      setTempLogoFile(null);
      setNewAdminEmail("");
      setValidationErrors({});
    };

    const handleAddAdmin = () => {
      if (!newAdminEmail.trim()) {
        toast.error("Please enter an email address")
      }

      const emailError = validateAdminEmail(newAdminEmail);
      if (emailError) {
        toast.error(emailError);
        return;
      }

      if (formData.admin_users.includes(newAdminEmail)) {
        toast.error("This email is already in the list")
      }

      setFormData((prev) => ({
        ...prev,
        admin_users: [...prev.admin_users, newAdminEmail],
      }));
      setNewAdminEmail("");
    };

    const handleRemoveAdmin = (email: string) => {
      if (formData.admin_users.length <= 1) {
        toast.error("At least one admin user is required");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        admin_users: prev.admin_users.filter((e: string) => e !== email),
      }));
    };

    const validateAllowedDomain = (domain: string) => {
      // Accept what people actually paste: "@6sense.com", "6sense.com", or a
    // full address like "x@6sense.com" — the save path extracts the domain
    // either way, so refusing an email here only blocked a valid intent.
    const domainRegex = /^(?:[^@\s]*@)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
      if (!domain.trim()) {
        return "Allowed domain is required";
      }
      if (!domainRegex.test(domain)) {
        return "Enter a domain like @example.com (a full email works too — we keep the domain).";
      }
      return null;
    };

    const validateAdminEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        return "Email is required";
      }
      if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
      }
      return null;
    };

    const handleChange = (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({
          ...prev,
          [field]: null,
        }));
      }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        fileUploadMutate({ file: e.target.files[0], category: "image" });
      }
    };

    const resolvedClientLogo = tempLogoFile
      ? `${String((API_CONFIG.defaults as { baseURL?: string }).baseURL || "").replace(/\/$/, "")}/${String(tempLogoFile?.file_path || "").replace(/^\//, "")}`
      : getClientLogoSrc(
          clientData,
          String((API_CONFIG.defaults as { baseURL?: string }).baseURL || ""),
        );

    return <section aria-label="Client information" className="max-w-2xl space-y-5">
      <h2 className="text-lg font-semibold">Client information</h2>
      {isEditMode ? <>
        <div><label htmlFor="edit-client-name" className="text-sm font-medium">Client name</label><Input id="edit-client-name" value={formData.name} onChange={event=>handleChange("name",event.target.value)} className="mt-2 h-9 border-pl-border" aria-invalid={!!validationErrors.name}/>{validationErrors.name && <p role="alert" className="mt-2 text-sm text-pl-red-text">{validationErrors.name}</p>}</div>
        <div><label htmlFor="edit-client-domain" className="text-sm font-medium">Allowed domain</label><Input id="edit-client-domain" value={formData.allowed_domain} onChange={event=>handleChange("allowed_domain",event.target.value)} placeholder="company.test" className="mt-2 h-9 border-pl-border" aria-invalid={!!validationErrors.allowed_domain}/><p className="mt-2 text-xs text-pl-text-2">Use the company domain for workspace entry. Invitations are managed separately.</p>{validationErrors.allowed_domain && <p role="alert" className="mt-2 text-sm text-pl-red-text">{validationErrors.allowed_domain}</p>}</div>
        <div><label htmlFor="edit-client-about" className="text-sm font-medium">Organization information</label><Textarea id="edit-client-about" value={formData.about} onChange={event=>handleChange("about",event.target.value)} className="mt-2 min-h-24 border-pl-border"/></div>
        <details className="border-t border-pl-border pt-4"><summary className="cursor-pointer text-sm font-medium">Organization logo</summary>{resolvedClientLogo && <img src={resolvedClientLogo} alt="Current organization logo" className="mt-3 h-12 max-w-32 object-contain"/>}<label htmlFor="edit-client-logo" className="mt-3 block text-sm">Upload logo</label><Input id="edit-client-logo" type="file" accept="image/*" disabled={isFileUploading} onChange={handleLogoChange} className="mt-2 border-pl-border"/>{isFileUploading && <p role="status" className="mt-2 text-sm text-pl-text-2">Uploading logo…</p>}</details>
        {isUpdating && <p role="status" className="text-sm text-pl-text-2">Saving client information…</p>}
      </> : <dl className="space-y-4 text-sm"><div><dt className="text-xs text-pl-text-2">Allowed domain</dt><dd className="mt-2 break-words">{clientData?.allowed_domain || "Not configured"}</dd></div><div><dt className="text-xs text-pl-text-2">Organization information</dt><dd className="mt-2 whitespace-pre-wrap break-words">{clientData?.about || "No organization information added"}</dd></div></dl>}
    </section>;
  }
);
ClientDetails.displayName = "ClientDetails";
export default ClientDetails;
