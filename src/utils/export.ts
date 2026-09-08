// utils/export.ts

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";

type Test = any;
type Reading = any;

// ==================================================
// HELPERS
// ==================================================

function baseName(test: Test) {
  const id = String(test?.freezerId ?? "test").replace(
    /[^A-Za-z0-9_-]/g,
    "_"
  );

  return `PDI_${id}`;
}

function rows(readings: Reading[]) {
  return readings.map((r) => ({
    elapsed_s: r.elapsedSeconds ?? "",
    voltage: r.voltage ?? "",
    current: r.current ?? "",
    power: r.power ?? "",
    energy: r.energy ?? "",
    gas_value: r.gasValue ?? "",
    gas_status: r.gasStatus ?? "",
    voltage_status: r.voltageStatus ?? "",
    current_status: r.currentStatus ?? "",
    power_status: r.powerStatus ?? "",
  }));
}

function escapeHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Use document directory for files we want to share
const DIR =
  FileSystem.documentDirectory ??
  FileSystem.cacheDirectory ??
  "";

async function share(
  uri: string,
  mimeType: string,
  dialogTitle: string
) {
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle,
  });
}

// ==================================================
// CSV EXPORT
// ==================================================

export async function exportCSV(
  test: Test,
  readings: Reading[]
) {
  try {
    const data = rows(readings);

    const headers = Object.keys(
      data[0] ?? {
        elapsed_s: "",
        voltage: "",
        current: "",
        power: "",
        energy: "",
        gas_value: "",
        gas_status: "",
        voltage_status: "",
        current_status: "",
        power_status: "",
      }
    );

    const lines = [headers.join(",")];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = String((row as any)[header] ?? "");

        // Escape quotes for CSV
        return `"${value.replace(/"/g, '""')}"`;
      });

      lines.push(values.join(","));
    }

    const csv =
      `Freezer,"${String(test.freezerId ?? "").replace(/"/g, '""')}"\n` +
      `Station,"${String(test.stationId ?? "").replace(/"/g, '""')}"\n` +
      `Overall,"${String(test.overallResult ?? "").replace(/"/g, '""')}"\n` +
      `Started,"${String(test.startedAt ?? "").replace(/"/g, '""')}"\n` +
      `Completed,"${String(test.completedAt ?? "").replace(/"/g, '""')}"\n\n` +
      lines.join("\n");

    const uri = `${DIR}${baseName(test)}.csv`;

    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await share(uri, "text/csv", "Export CSV");

  } catch (error) {
    console.error("CSV Export Error:", error);

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to export CSV"
    );
  }
}

// ==================================================
// EXCEL EXPORT
// ==================================================

export async function exportXLSX(
  test: Test,
  readings: Reading[]
) {
  try {
    // Readings sheet
    const ws = XLSX.utils.json_to_sheet(
      rows(readings)
    );

    // Summary sheet
    const meta = XLSX.utils.aoa_to_sheet([
      ["Freezer", test.freezerId ?? ""],
      ["Station", test.stationId ?? ""],
      ["Started", test.startedAt ?? ""],
      ["Completed", test.completedAt ?? ""],
      ["Overall", test.overallResult ?? ""],
      ["Voltage", test.voltageResult ?? ""],
      ["Current", test.currentResult ?? ""],
      ["Power", test.powerResult ?? ""],
      ["Gas", test.gasResult ?? ""],
    ]);

    // Create workbook
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      meta,
      "Summary"
    );

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Readings"
    );

    // Convert to Base64
    const b64 = XLSX.write(wb, {
      type: "base64",
      bookType: "xlsx",
    });

    const uri = `${DIR}${baseName(test)}.xlsx`;

    // Save file
    await FileSystem.writeAsStringAsync(
      uri,
      b64,
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

    // Share
    await share(
      uri,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Export Excel"
    );

  } catch (error) {
    console.error("Excel Export Error:", error);

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to export Excel"
    );
  }
}

// ==================================================
// PDF EXPORT
// ==================================================

export async function exportPDF(
  test: Test,
  readings: Reading[]
) {
  try {
    const pass =
      test.overallResult === "PASS";

    // ----------------------------------------------
    // Result row helper
    // ----------------------------------------------

    const resRow = (
      label: string,
      value: string | null | undefined
    ) => {
      let color = "#64748b";

      if (value === "PASS") {
        color = "#16a34a";
      }

      if (value === "FAIL") {
        color = "#dc2626";
      }

      return `
        <tr>
          <td>
            ${escapeHtml(label)}
          </td>

          <td
            style="
              color: ${color};
              font-weight: 700;
            "
          >
            ${escapeHtml(value ?? "—")}
          </td>
        </tr>
      `;
    };

    // ----------------------------------------------
    // Reading rows
    // ----------------------------------------------

    const dataRows = rows(readings)
      .map(
        (r) => `
          <tr>
            <td>${escapeHtml(r.elapsed_s)}</td>
            <td>${escapeHtml(r.voltage)}</td>
            <td>${escapeHtml(r.current)}</td>
            <td>${escapeHtml(r.power)}</td>
            <td>${escapeHtml(r.energy)}</td>
            <td>${escapeHtml(r.gas_value)}</td>
            <td>${escapeHtml(r.gas_status)}</td>
          </tr>
        `
      )
      .join("");

    // ----------------------------------------------
    // Verdict
    // ----------------------------------------------

    let verdictText = "PDI REPORT";
    let verdictColor = "#64748b";

    if (test.overallResult === "PASS") {
      verdictText = "PDI PASSED";
      verdictColor = "#16a34a";
    } else if (test.overallResult === "FAIL") {
      verdictText = "PDI FAILED";
      verdictColor = "#dc2626";
    } else if (test.status) {
      verdictText = String(test.status);
    }

    // ----------------------------------------------
    // HTML
    // ----------------------------------------------

    const html = `
      <!DOCTYPE html>

      <html>

      <head>
  <meta charset="utf-8" />

  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />

  <style>

    @page {
      margin: 20px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', Arial, sans-serif;
      color: #0f172a;
      padding: 10px;
      font-weight: 400;
    }

    h1 {
      margin: 0 0 5px 0;
      font-size: 26px;
      font-weight: 700;
    }

    h3 {
      margin-top: 24px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .sub {
      color: #64748b;
      font-size: 13px;
      margin-bottom: 10px;
    }

    .verdict {
      font-size: 26px;
      font-weight: 800;
      color: ${verdictColor};
      margin: 12px 0 20px 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 11px;
      margin-top: 8px;
    }

    td,
    th {
      border: 1px solid #cbd5e1;
      padding: 7px;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      font-weight: 600;
    }

    .meta td:first-child {
      width: 140px;
      color: #64748b;
      font-weight: 600;
    }

    .footer {
      margin-top: 25px;
      color: #94a3b8;
      font-size: 10px;
    }

  </style>
</head>

      <body>

        <h1>
          Freezer PDI Report
        </h1>


        <div class="sub">

          Freezer:
          <b>
            ${escapeHtml(test.freezerId ?? "")}
          </b>

          &nbsp;&nbsp;|&nbsp;&nbsp;

          Station:
          <b>
            ${escapeHtml(test.stationId ?? "")}
          </b>

        </div>


        <div class="verdict">
          ${escapeHtml(verdictText)}
        </div>


        <!-- TEST SUMMARY -->

        <h3>
          Test Summary
        </h3>


        <table class="meta">

          <tr>
            <td>Started</td>

            <td>
              ${escapeHtml(test.startedAt ?? "—")}
            </td>
          </tr>


          <tr>
            <td>Completed</td>

            <td>
              ${escapeHtml(test.completedAt ?? "—")}
            </td>
          </tr>


          ${resRow(
            "Voltage",
            test.voltageResult
          )}

          ${resRow(
            "Current",
            test.currentResult
          )}

          ${resRow(
            "Power",
            test.powerResult
          )}

          ${resRow(
            "Gas",
            test.gasResult
          )}

        </table>


        <!-- READINGS -->

        <h3>
          Test Readings (${readings.length})
        </h3>


        <table>

          <thead>

            <tr>
              <th>Time (s)</th>
              <th>Voltage (V)</th>
              <th>Current (A)</th>
              <th>Power (W)</th>
              <th>Energy</th>
              <th>Gas</th>
              <th>Gas Status</th>
            </tr>

          </thead>


          <tbody>

            ${dataRows}

          </tbody>

        </table>


        <div class="footer">
          Generated by Freezer PDI Application
        </div>


      </body>

      </html>
    `;

    // ==============================================
    // STEP 1: GENERATE PDF WITH BASE64
    // ==============================================

    const result =
      await Print.printToFileAsync({
        html,

        // IMPORTANT:
        // Get PDF data directly as Base64.
        // Do NOT read the protected Print cache URI.
        base64: true,
      });

    console.log(
      "PDF URI:",
      result.uri
    );

    // ==============================================
    // STEP 2: CHECK BASE64
    // ==============================================

    if (!result.base64) {
      throw new Error(
        "PDF was generated but Base64 data was not returned."
      );
    }

    console.log(
      "PDF Base64 generated successfully."
    );

    // ==============================================
    // STEP 3: SAVE PDF TO DOCUMENT DIRECTORY
    // ==============================================

    const pdfUri =
      `${DIR}${baseName(test)}.pdf`;

    await FileSystem.writeAsStringAsync(
      pdfUri,
      result.base64,
      {
        encoding:
          FileSystem.EncodingType.Base64,
      }
    );

    console.log(
      "PDF saved successfully:",
      pdfUri
    );

    // ==============================================
    // STEP 4: VERIFY FILE
    // ==============================================

    const fileInfo =
      await FileSystem.getInfoAsync(pdfUri);

    if (!fileInfo.exists) {
      throw new Error(
        "PDF file could not be saved."
      );
    }

    // ==============================================
    // STEP 5: SHARE THE NEW PDF
    // ==============================================

    const available =
      await Sharing.isAvailableAsync();

    if (!available) {
      throw new Error(
        "Sharing is not available on this device."
      );
    }

    await Sharing.shareAsync(
      pdfUri,
      {
        mimeType:
          "application/pdf",

        dialogTitle:
          `Export ${baseName(test)} PDF`,

        UTI:
          ".pdf",
      }
    );

    console.log(
      "PDF shared successfully."
    );

  } catch (error) {

    console.error(
      "PDF Export Error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to export PDF"
    );
  }
}