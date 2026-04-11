import React from "react";

export default function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border rounded-md p-6">
      <legend className="px-2 text-sm">{title}</legend>
      {children}
    </fieldset>
  );
}
