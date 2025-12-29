"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { employeeApi } from "@/lib/employees/api";
import type { Employee } from "@/lib/employees/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Briefcase, Building } from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const { state } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployee = async () => {
      if (state.status !== "authenticated" || !state.tokens) return;
      if (!params.id || typeof params.id !== "string") return;

      setLoading(true);
      setError(null);

      try {
        const data = await employeeApi.get(params.id, state.tokens);
        setEmployee(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load employee");
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [params.id, state.status, state.tokens]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEmploymentType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const formatStatus = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive font-medium mb-4">
          {error || "Employee not found"}
        </div>
        <Link href="/employees">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to employees
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {employee.personal.firstName[0]}{employee.personal.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {employee.personal.firstName} {employee.personal.lastName}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="font-mono text-xs">{employee.employeeCode}</Badge>
                <span>•</span>
                <span>{employee.professional.title || "No Title"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/employees/${employee._id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Personal info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{employee.personal.contact.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee.personal.contact.phone || "-"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.personal.addresses?.current ? (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{employee.personal.addresses.current.line1}</p>
                    {employee.personal.addresses.current.line2 && <p>{employee.personal.addresses.current.line2}</p>}
                    <p>
                      {employee.personal.addresses.current.city}, {employee.personal.addresses.current.state} {employee.personal.addresses.current.postalCode}
                    </p>
                    <p>{employee.personal.addresses.current.country}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No address on file</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle/Right Column: Professional & Other */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{employee.professional.department || "-"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Employment Type</label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatEmploymentType(employee.professional.employmentType)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Badge variant={
                  employee.professional.status === 'active' ? 'success' :
                    employee.professional.status === 'terminated' ? 'destructive' : 'warning'
                }>
                  {formatStatus(employee.professional.status)}
                </Badge>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatDate(employee.professional.startDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                <p className="text-sm">{formatDate(employee.personal.dateOfBirth)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Gender</label>
                <p className="text-sm capitalize">{employee.personal.gender || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Marital Status</label>
                <p className="text-sm capitalize">{employee.personal.maritalStatus || "-"}</p>
              </div>
            </CardContent>
          </Card>

          {employee.payroll && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payroll Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Base Salary</label>
                  <p className="text-lg font-mono font-medium">
                    {employee.payroll.baseSalary
                      ? `${employee.payroll.salaryCurrency || "USD"} ${employee.payroll.baseSalary.toLocaleString()}`
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Variable Pay</label>
                  <p className="text-sm font-medium">
                    {employee.payroll.variablePayPercent ? `${employee.payroll.variablePayPercent}%` : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
