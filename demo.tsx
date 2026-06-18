import Component from "@/components/ui/ink-reveal";

export default function DemoOne() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "400px",
        overflow: "hidden",
        borderRadius: "12px",
      }}
    >
      <img
        src="/1.png"
        alt="Financial trading background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <Component />
    </div>
  );
}
