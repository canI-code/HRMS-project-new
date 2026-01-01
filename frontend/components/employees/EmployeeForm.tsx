"use client";

import { useState, useEffect } from "react";
import type {
  CreateEmployeePayload,
  UpdateEmployeePayload,
  Employee,
  EmploymentType,
  EmployeeStatus,
  Gender,
  MaritalStatus,
} from "@/lib/employees/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertCircle, Save } from "lucide-react";
import { employeeApi } from "@/lib/employees/api";
import { useAuth } from "@/lib/auth/context";

// Predefined lists for dropdowns (Simulating data that might come from settings in the future)
const DEPARTMENTS = ["Engineering", "Human Resources", "Sales", "Marketing", "Finance", "Operations", "Legal", "IT Support", "Design"];
const TITLES = [
  "Software Engineer", "Senior Software Engineer", "Tech Lead", "Engineering Manager",
  "HR Specialist", "HR Manager",
  "Sales Representative", "Sales Director",
  "Marketing Manager", "Content Specialist",
  "Accountant", "Finance Manager",
  "Operations Manager",
  "Legal Counsel",
  "Product Manager", "Project Manager"
];
const LOCATIONS = ["New York", "San Francisco", "London", "Bangalore", "Sydney", "Singapore", "Berlin", "Remote"];
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+44", country: "UK" },
  { code: "+91", country: "IN" },
  { code: "+61", country: "AU" },
  { code: "+65", country: "SG" },
  { code: "+49", country: "DE" },
];

interface EmployeeFormProps {
  employee?: Employee;
  organizationId: string;
  onSubmit: (payload: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function EmployeeForm({ employee, organizationId, onSubmit, onCancel, mode }: EmployeeFormProps) {
  const { state: authState } = useAuth();
  const tokens = authState.tokens;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic form options (fetched from API)
  const [formOptions, setFormOptions] = useState<{
    departments: { value: string; label: string }[];
    titles: { value: string; label: string }[];
    locations: { value: string; label: string }[];
  }>({ departments: [], titles: [], locations: [] });

  // Fetch form options on mount
  useEffect(() => {
    if (!tokens) return;
    employeeApi.getFormOptions(tokens)
      .then(opts => setFormOptions(opts))
      .catch(e => {
        console.warn('Failed to load form options, using defaults:', e);
        // Fallback to static lists
        setFormOptions({
          departments: DEPARTMENTS.map(d => ({ value: d.toLowerCase().replace(/\s+/g, '_'), label: d })),
          titles: TITLES.map(t => ({ value: t.toLowerCase().replace(/\s+/g, '_'), label: t })),
          locations: LOCATIONS.map(l => ({ value: l.toLowerCase().replace(/\s+/g, '_'), label: l })),
        });
      });
  }, [tokens]);

  // Personal information
  const [employeeCode, setEmployeeCode] = useState(employee?.employeeCode || "");
  const [firstName, setFirstName] = useState(employee?.personal.firstName || "");
  const [lastName, setLastName] = useState(employee?.personal.lastName || "");
  const [middleName, setMiddleName] = useState(employee?.personal.middleName || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    employee?.personal.dateOfBirth ? employee.personal.dateOfBirth.split("T")[0] : ""
  );
  const [gender, setGender] = useState<Gender | "">(employee?.personal.gender || "");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | "">(
    employee?.personal.maritalStatus || ""
  );
  const [email, setEmail] = useState(employee?.personal.contact.email || "");

  // Phone handling
  const [phoneCode, setPhoneCode] = useState("+91"); // Default
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (employee?.personal.contact.phone) {
      // Try to parse existing phone
      const match = COUNTRY_CODES.find(c => employee.personal.contact.phone?.startsWith(c.code));
      if (match) {
        setPhoneCode(match.code);
        setPhoneNumber(employee.personal.contact.phone.replace(match.code, "").trim());
      } else {
        setPhoneNumber(employee.personal.contact.phone || "");
      }
    }
  }, [employee]);

  // Address
  const [addressLine1, setAddressLine1] = useState(employee?.personal.addresses?.current?.line1 || "");
  const [addressLine2, setAddressLine2] = useState(employee?.personal.addresses?.current?.line2 || "");
  const [city, setCity] = useState(employee?.personal.addresses?.current?.city || "");
  const [state, setState] = useState(employee?.personal.addresses?.current?.state || "");
  const [country, setCountry] = useState(employee?.personal.addresses?.current?.country || "");
  const [postalCode, setPostalCode] = useState(employee?.personal.addresses?.current?.postalCode || "");

  // Auto-fill City/State based on Zip
  useEffect(() => {
    if (postalCode && postalCode.length >= 5 && country) {
      const countryMap: Record<string, string> = { "United States": "us", "India": "in", "Germany": "de" };
      const code = countryMap[country] || "us";

      const fetchZip = async () => {
        try {
          const res = await fetch(`https://api.zippopotam.us/${code}/${postalCode}`);
          if (res.ok) {
            const data = await res.json();
            if (data.places && data.places.length > 0) {
              setCity(data.places[0]["place name"]);
              setState(data.places[0]["state"]);
            }
          }
        } catch (e) {
          // Ignore errors
        }
      };

      const timeout = setTimeout(fetchZip, 500);
      return () => clearTimeout(timeout);
    }
  }, [postalCode, country]);


  // Professional information
  const [department, setDepartment] = useState(employee?.professional.department || "");
  const [title, setTitle] = useState(employee?.professional.title || "");
  const [location, setLocation] = useState(employee?.professional.location || "");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    employee?.professional.employmentType || "full_time"
  );
  const [startDate, setStartDate] = useState(
    employee?.professional.startDate ? employee.professional.startDate.split("T")[0] : ""
  );
  const [status, setStatus] = useState<EmployeeStatus>(employee?.professional.status || "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18) throw new Error("Employee must be at least 18 years old");
        if (age > 65) throw new Error("Employee must be at most 65 years old");
      }

      const fullPhone = phoneNumber ? `${phoneCode} ${phoneNumber}` : undefined;

      const payload: CreateEmployeePayload | UpdateEmployeePayload = {
        ...(mode === "create" && { organizationId, employeeCode }),
        personal: {
          firstName,
          lastName,
          ...(middleName && { middleName }),
          ...(dateOfBirth && { dateOfBirth }),
          ...(gender && { gender }),
          ...(maritalStatus && { maritalStatus }),
          contact: {
            email,
            ...(fullPhone && { phone: fullPhone }),
          },
          ...(addressLine1 && city && country && {
            addresses: {
              current: {
                line1: addressLine1,
                ...(addressLine2 && { line2: addressLine2 }),
                city,
                ...(state && { state }),
                country,
                ...(postalCode && { postalCode }),
              },
            },
          }),
        },
        professional: {
          ...(department && { department }),
          ...(title && { title }),
          ...(location && { location }),
          employmentType,
          startDate,
          ...(mode === "create" && { status }),
        },
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Employee Code (only for create) */}
      {mode === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label htmlFor="employeeCode">Employee Code</Label>
              <Input
                id="employeeCode"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Auto-generated (e.g. EMP-2406001)"
                className="mt-1.5 bg-muted"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Unique identifier. Will be automatically assigned upon creation.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>First Name <span className="text-destructive">*</span></Label>
            <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Last Name <span className="text-destructive">*</span></Label>
            <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Middle Name</Label>
            <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | "")}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Marital Status</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus | "")}
            >
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="flex gap-2">
              <select
                className="w-[80px] flex h-10 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="1234567890"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" />
          </div>
          <div className="space-y-2">
            <Label>Postal Code</Label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Type zip to auto-fill" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Address Line 1</Label>
            <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Address Line 2</Label>
            <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State/Province</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Professional Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Department</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              {((formOptions?.departments?.length ?? 0) > 0 ? formOptions.departments : DEPARTMENTS.map(d => ({ value: d, label: d }))).map(d => <option key={d.value} value={d.label}>{d.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Title / Designation</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              <option value="">Select Title</option>
              {((formOptions?.titles?.length ?? 0) > 0 ? formOptions.titles : TITLES.map(t => ({ value: t, label: t }))).map(t => <option key={t.value} value={t.label}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select Location</option>
              {((formOptions?.locations?.length ?? 0) > 0 ? formOptions.locations : LOCATIONS.map(l => ({ value: l, label: l }))).map(l => <option key={l.value} value={l.label}>{l.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Employment Type <span className="text-destructive">*</span></Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Start Date <span className="text-destructive">*</span></Label>
            <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label>Initial Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note about Salary Assignment */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>💡 Note:</strong> Employee salaries are managed through the <strong>Payroll</strong> module.
        After creating this employee, assign their salary structure and base pay in the Payroll → Assign Salary section.
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          isLoading={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {mode === "create" ? "Create Employee" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
