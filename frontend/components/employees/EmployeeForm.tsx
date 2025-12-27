"use client";

import { useState } from "react";
import type {
  CreateEmployeePayload,
  UpdateEmployeePayload,
  Employee,
  EmploymentType,
  EmployeeStatus,
  Gender,
  MaritalStatus,
} from "../../lib/employees/types";

interface EmployeeFormProps {
  employee?: Employee;
  organizationId: string; // Pass organizationId as prop
  onSubmit: (payload: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function EmployeeForm({ employee, organizationId, onSubmit, onCancel, mode }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [phone, setPhone] = useState(employee?.personal.contact.phone || "");

  // Address
  const [addressLine1, setAddressLine1] = useState(employee?.personal.addresses?.current?.line1 || "");
  const [addressLine2, setAddressLine2] = useState(employee?.personal.addresses?.current?.line2 || "");
  const [city, setCity] = useState(employee?.personal.addresses?.current?.city || "");
  const [state, setState] = useState(employee?.personal.addresses?.current?.state || "");
  const [country, setCountry] = useState(employee?.personal.addresses?.current?.country || "");
  const [postalCode, setPostalCode] = useState(employee?.personal.addresses?.current?.postalCode || "");

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

  // Payroll information
  const [baseSalary, setBaseSalary] = useState(employee?.payroll?.baseSalary?.toString() || "");
  const [salaryCurrency, setSalaryCurrency] = useState(employee?.payroll?.salaryCurrency || "USD");
  const [variablePayPercent, setVariablePayPercent] = useState(
    employee?.payroll?.variablePayPercent?.toString() || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
            ...(phone && { phone }),
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
        ...((baseSalary || variablePayPercent) && {
          payroll: {
            ...(salaryCurrency && { salaryCurrency }),
            ...(baseSalary && { baseSalary: parseFloat(baseSalary) }),
            ...(variablePayPercent && { variablePayPercent: parseFloat(variablePayPercent) }),
          },
        }),
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Employee Code (only for create) */}
      {mode === "create" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Employee Code</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Employee Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="EMP001"
            />
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Personal Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Middle Name</label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | "")}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Marital Status</label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus | "")}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>
        </div>

        {/* Address */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Current Address</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">Address Line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">Address Line 2</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">State/Province</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Professional Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Payroll Information */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Payroll Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Base Salary</label>
            <input
              type="number"
              step="0.01"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Currency</label>
            <input
              type="text"
              value={salaryCurrency}
              onChange={(e) => setSalaryCurrency(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="USD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Variable Pay %</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={variablePayPercent}
              onChange={(e) => setVariablePayPercent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              placeholder="10"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : mode === "create" ? "Create Employee" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
