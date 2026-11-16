import garland from "@/assets/christmas-garland.jpg";

export function ChristmasGarland() {
  return (
    <div className="christmas-garland" aria-hidden="true">
      <img src={garland} alt="" width={1536} height={512} className="h-full w-full object-cover object-top" />
    </div>
  );
}