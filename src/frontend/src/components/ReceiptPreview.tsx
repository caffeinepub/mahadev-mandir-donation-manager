import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import type { Donation, Temple } from "../backend.d";
import { convertToHindi } from "../utils/hindiNumbers";

interface ReceiptPreviewProps {
  data: Donation;
  temple: Temple;
  onClose: () => void;
}

// Type augmentation for jsPDF global
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (
        o: string,
        u: string,
        f: string,
      ) => {
        addImage: (
          d: string,
          t: string,
          x: number,
          y: number,
          w: number,
          h: number,
        ) => void;
        save: (name: string) => void;
      };
    };
    html2canvas: (el: HTMLElement, opts: object) => Promise<HTMLCanvasElement>;
  }
}

export function ReceiptPreview({ data, temple, onClose }: ReceiptPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const amount = Number(data.amount);

  const handlePDF = async () => {
    if (!contentRef.current || !window.html2canvas || !window.jspdf) {
      alert("PDF लाइब्रेरी लोड नहीं हुई। कृपया पुनः प्रयास करें।");
      return;
    }
    try {
      const canvas = await window.html2canvas(contentRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#fffcf5",
      });
      const pdf = new window.jspdf.jsPDF("p", "mm", "a5");
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        148,
        210,
      );
      pdf.save(`Receipt_${data.recNo.toString()}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF निर्यात में त्रुटि हुई।");
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/92 z-[6000] flex flex-col items-center justify-start overflow-y-auto p-4 backdrop-blur-md"
        data-ocid="receipt.modal"
      >
        {/* Action buttons */}
        <div className="flex gap-4 my-6 no-print sticky top-4 z-10">
          <Button
            onClick={handlePDF}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-black uppercase text-xs shadow-2xl active:scale-95 transition-transform"
            data-ocid="receipt.primary_button"
          >
            <Download className="w-4 h-4 mr-2" />
            Save PDF
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-black uppercase text-xs shadow-2xl active:scale-95 transition-transform border-white"
            data-ocid="receipt.close_button"
          >
            <X className="w-4 h-4 mr-1" />
            बंद करें
          </Button>
        </div>

        {/* Receipt card */}
        <div
          ref={contentRef}
          className="w-[140mm] receipt-bg"
          style={{
            padding: "3mm",
            fontFamily: "'General Sans', sans-serif",
            color: "#1a1a1a",
            border: "1px solid #e0d0b0",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              border: "3px double #b71c1c",
              padding: "10px",
              backgroundColor: "rgba(255,255,255,0.97)",
              position: "relative",
              minHeight: "200mm",
            }}
          >
            {/* Om watermarks */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                fontSize: "36px",
                opacity: 0.12,
                color: "#ff8f00",
                lineHeight: 1,
              }}
            >
              🕉️
            </div>
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                fontSize: "36px",
                opacity: 0.12,
                color: "#ff8f00",
                lineHeight: 1,
              }}
            >
              🕉️
            </div>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <p
                style={{
                  color: "#b71c1c",
                  fontWeight: 900,
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "2px",
                }}
              >
                🚩 !! जय बाबा नागनाथ महादेव की जय !! 🚩
              </p>
              <h1
                style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: "26px",
                  color: "#b71c1c",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  margin: "4px 0",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                }}
              >
                {temple.name}
              </h1>
              <p
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  opacity: 0.65,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                }}
              >
                {temple.address}
              </p>
            </div>

            {/* Welcome banner */}
            <div
              style={{
                fontSize: "10px",
                fontWeight: 900,
                color: "#b71c1c",
                border: "1px solid #f3c0c0",
                borderRadius: "8px",
                padding: "6px 12px",
                marginBottom: "10px",
                background: "#fff5f5",
                textAlign: "center",
                textTransform: "uppercase",
                fontStyle: "italic",
                letterSpacing: "0.05em",
              }}
            >
              सादर अभिनंदन! महादेव की सेवा स्वीकार हुई। 🙏
            </div>

            {/* Appeal paragraphs */}
            <div
              style={{
                fontSize: "10px",
                lineHeight: 1.6,
                padding: "0 4px",
                textAlign: "justify",
                fontWeight: 600,
                color: "#1a1a1a",
                marginBottom: "10px",
              }}
            >
              <p style={{ marginBottom: "4px" }}>{temple.appeal1}</p>
              <p style={{ marginBottom: "4px" }}>{temple.appeal2}</p>
              <p>{temple.appeal3}</p>
            </div>

            {/* Service pledge */}
            <div
              style={{
                border: "2px solid #b71c1c",
                borderRadius: "8px",
                padding: "6px 10px",
                background: "#fff5f5",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "8px",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              <span style={{ color: "#b71c1c", flexShrink: 0 }}>
                सेवा संकल्प :
              </span>
              <span
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "8px",
                  marginLeft: "8px",
                }}
              >
                {temple.rules}
              </span>
            </div>

            {/* Donation details box */}
            <div
              style={{
                border: "1.5px solid #d4af37",
                borderRadius: "10px",
                background: "#fafaf2",
                padding: "8px 10px",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              {/* Receipt ID + Date */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "5px",
                  marginBottom: "6px",
                  fontSize: "9px",
                }}
              >
                <span>
                  रसीद ID:{" "}
                  <strong style={{ color: "#b71c1c" }}>
                    #{data.formattedId}
                  </strong>
                </span>
                <span>
                  तिथि: <strong>{formatDate(data.date)}</strong>
                </span>
              </div>

              {/* Donor name */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px dashed #d1d5db",
                  padding: "4px 0",
                  fontSize: "9px",
                }}
              >
                <span style={{ color: "#b71c1c", marginRight: "8px" }}>
                  नाम:
                </span>
                <span style={{ fontWeight: 900, color: "#111" }}>
                  {data.donorName}
                </span>
              </div>

              {/* Address */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px dashed #d1d5db",
                  padding: "4px 0",
                  fontSize: "9px",
                }}
              >
                <span style={{ color: "#b71c1c", marginRight: "8px" }}>
                  पता:
                </span>
                <span style={{ fontWeight: 700, color: "#111" }}>
                  {data.address}
                </span>
              </div>

              {/* Amount + Signature */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  paddingTop: "6px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: 900,
                      color: "#b71c1c",
                      fontStyle: "italic",
                      lineHeight: 1,
                    }}
                  >
                    ₹{amount.toLocaleString("en-IN")}/-
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      color: "#6b7280",
                      marginTop: "3px",
                      fontWeight: 900,
                    }}
                  >
                    {convertToHindi(amount)} मात्र
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    minWidth: "100px",
                    borderLeft: "1px solid #d1d5db",
                    paddingLeft: "8px",
                  }}
                >
                  <div
                    style={{
                      borderBottom: "1px solid #111",
                      paddingBottom: "4px",
                      fontSize: "11px",
                      fontWeight: 900,
                      fontStyle: "italic",
                    }}
                  >
                    {data.volunteerName}
                  </div>
                  <small
                    style={{
                      fontSize: "7px",
                      opacity: 0.4,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    प्राप्तकर्ता
                  </small>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "8px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: "22px",
                  color: "#b71c1c",
                  lineHeight: 1,
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                ॥ हर हर महादेव ॥
              </p>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </motion.div>
    </AnimatePresence>
  );
}
