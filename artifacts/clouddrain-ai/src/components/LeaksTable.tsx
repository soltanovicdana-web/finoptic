import { useState, useMemo } from "react";
import { type LeakRecord, type LeakRecordLeakType } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface LeaksTableProps {
  leaks: LeakRecord[];
}

export function LeaksTable({ leaks }: LeaksTableProps) {
  const [filterType, setFilterType] = useState<LeakRecordLeakType | "ALL">("ALL");

  const filteredLeaks = useMemo(() => {
    if (filterType === "ALL") return leaks;
    return leaks.filter((l) => l.leakType === filterType);
  }, [leaks, filterType]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const getBadgeVariant = (type: LeakRecordLeakType) => {
    switch (type) {
      case "WASTEFUL_GPU":
        return "bg-destructive/10 text-destructive border-destructive/50";
      case "ORPHANED_STORAGE":
        return "bg-primary/10 text-primary border-primary/50";
      case "UNDERUTILIZED_COMPUTE":
        return "bg-secondary/10 text-secondary border-secondary/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatType = (type: string) => type.replace(/_/g, " ");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filter by type:</span>
        </div>
        <Select value={filterType} onValueChange={(val) => setFilterType(val as LeakRecordLeakType | "ALL")}>
          <SelectTrigger className="w-[250px] font-mono text-xs rounded-none border-border bg-card">
            <SelectValue placeholder="All Leak Types" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="ALL" className="font-mono text-xs">ALL TYPES</SelectItem>
            <SelectItem value="UNDERUTILIZED_COMPUTE" className="font-mono text-xs">UNDERUTILIZED COMPUTE</SelectItem>
            <SelectItem value="ORPHANED_STORAGE" className="font-mono text-xs">ORPHANED STORAGE</SelectItem>
            <SelectItem value="WASTEFUL_GPU" className="font-mono text-xs">WASTEFUL GPU</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-mono text-xs font-bold text-muted-foreground uppercase">Resource ID</TableHead>
              <TableHead className="font-mono text-xs font-bold text-muted-foreground uppercase">Region</TableHead>
              <TableHead className="font-mono text-xs font-bold text-muted-foreground uppercase">Leak Type</TableHead>
              <TableHead className="font-mono text-xs font-bold text-muted-foreground uppercase text-right">Monthly Waste</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeaks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-mono text-sm">
                  No leaks found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeaks.map((leak, idx) => (
                <TableRow 
                  key={`${leak.resourceId}-${idx}`} 
                  className="border-border hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <TableCell className="font-mono text-sm text-foreground">
                    {leak.resourceId}
                    <div className="text-[10px] text-muted-foreground mt-1 max-w-[300px] truncate" title={leak.details}>
                      {leak.details}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {leak.region}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-[10px] rounded-none px-2 py-0.5 border ${getBadgeVariant(leak.leakType)}`}>
                      {formatType(leak.leakType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-destructive">
                    {formatCurrency(leak.monthlyWaste)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
