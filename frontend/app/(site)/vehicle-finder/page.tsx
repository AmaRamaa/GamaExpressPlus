import VehicleFinder from "@/components/VehicleFinder";

export default function VehicleFinderPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Vehicle Finder</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Select your manufacturer, model, and car year to see only the parts that fit — no guesswork, no returns.
        </p>
      </div>
      <div className="mx-auto mt-8 max-w-2xl">
        <VehicleFinder />
      </div>
      <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-surface-border bg-surface-muted p-5 text-sm text-ink-soft">
        <p className="font-semibold text-ink">Not sure of your exact model year?</p>
        <p className="mt-1">
          Check your vehicle registration document (or vehicle logbook) for the first registration year.
        </p>
      </div>
    </div>
  );
}
