"use client";

import { useActionState } from "react";
import { SaveIcon, Trash2Icon } from "lucide-react";

import {
  confirmDocumentDetailsAction,
  removeReadinessDocumentAction,
} from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";

const documentKinds = [
  ["pay_stub", "Pay statement"],
  ["benefits_letter", "Benefits letter"],
  ["photo_id", "Photo ID"],
  ["bank_statement", "Bank statement"],
  ["other", "Other document"],
] as const;

export function DocumentControls({
  sessionId,
  documentId,
  kind,
  issuedOn,
  confirmed,
}: {
  sessionId: string;
  documentId: string;
  kind: string;
  issuedOn: string | null;
  confirmed: boolean;
}) {
  const [detailsState, saveDetails, saving] = useActionState(
    confirmDocumentDetailsAction,
    INITIAL_READINESS_ACTION_STATE,
  );
  const [removeState, removeDocument, removing] = useActionState(
    removeReadinessDocumentAction,
    INITIAL_READINESS_ACTION_STATE,
  );

  return (
    <div className="space-y-3 border-t border-border/70 bg-muted/15 p-4">
      <form action={saveDetails} className="space-y-3">
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="documentId" value={documentId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`kind-${documentId}`}>Document type</Label>
            <select
              id={`kind-${documentId}`}
              name="kind"
              defaultValue={kind}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {documentKinds.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`issued-${documentId}`}>Document date</Label>
            <Input
              id={`issued-${documentId}`}
              name="issuedOn"
              type="date"
              defaultValue={issuedOn ?? ""}
              className="h-9"
            />
          </div>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Confirm or correct the type and date before this document can count on your checklist.
        </p>
        <ActionMessage state={detailsState} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {confirmed ? "You confirmed these details." : "Waiting for your confirmation."}
          </span>
          <Button type="submit" size="sm" disabled={saving}>
            <SaveIcon className="h-3.5 w-3.5" />
            {saving ? "Saving…" : confirmed ? "Save details" : "Confirm details"}
          </Button>
        </div>
      </form>

      <ActionMessage state={removeState} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2Icon className="h-3.5 w-3.5" /> Remove document
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this document?</AlertDialogTitle>
            <AlertDialogDescription>
              The original file and every suggested or confirmed field linked to it will be deleted.
              Your packet and checklist will update immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep document</AlertDialogCancel>
            <form action={removeDocument}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="documentId" value={documentId} />
              <AlertDialogAction
                type="submit"
                disabled={removing}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removing ? "Removing…" : "Remove permanently"}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
