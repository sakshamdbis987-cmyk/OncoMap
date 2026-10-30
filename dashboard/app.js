(() => {
  "use strict";

  const genes = ["BRCA1", "BRCA2", "TP53", "ERBB2", "PIK3CA", "ESR1", "PTEN", "EGFR"];
  const significanceThreshold = 0.05;
  const elements = {
    file: document.getElementById("tsv-file"),
    status: document.getElementById("upload-status"),
    geneFilter: document.getElementById("gene-filter"),
    search: document.getElementById("table-search"),
    count: document.getElementById("result-count"),
    message: document.getElementById("table-message"),
    scroll: document.getElementById("table-scroll"),
    body: document.getElementById("results-body"),
    navToggle: document.getElementById("nav-toggle"),
    nav: document.getElementById("primary-nav")
  };

  let probeResults = [];
  let sortKey = "adjP";
  let sortAscending = true;

  const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  const sortLabels = { gene: "target gene", probe: "probe ID", logFC: "log fold change", adjP: "adjusted P-value", significance: "significance" };

  function setStatus(message, state) {
    elements.status.textContent = message;
    if (state) elements.status.dataset.state = state;
    else delete elements.status.dataset.state;
  }

  function resetTableControls() {
    elements.geneFilter.value = "all";
    elements.search.value = "";
    sortKey = "adjP";
    sortAscending = true;
    updateSortIndicators();
  }

  function clearResults(message) {
    probeResults = [];
    elements.body.replaceChildren();
    elements.scroll.hidden = true;
    elements.geneFilter.disabled = true;
    elements.search.disabled = true;
    elements.count.textContent = "0 matching probes";
    elements.message.hidden = false;
    elements.message.querySelector("p").textContent = message;
    resetTableControls();
  }

  function parseNumericCell(text) {
    const value = text.trim().replace(/^"|"$/g, "");
    if (!numberPattern.test(value)) return Number.NaN;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  function parseTsv(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
    if (!lines.length || !lines[0].trim()) throw new Error("The file is empty.");
    const header = lines[0].split("\t").map((value) => value.trim().replace(/^"|"$/g, ""));
    const required = ["ID", "adj.P.Val", "logFC", "Gene.symbol"];
    const indexes = Object.fromEntries(required.map((name) => [name, header.indexOf(name)]));
    const missing = required.filter((name) => indexes[name] < 0);
    if (missing.length) throw new Error(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);

    const results = [];
    const invalidRows = [];
    let targetRows = 0;
    let malformedRows = 0;
    for (let lineNumber = 1; lineNumber < lines.length; lineNumber += 1) {
      const line = lines[lineNumber];
      if (!line.trim()) continue;
      const cells = line.split("\t");
      if (cells.length !== header.length) {
        malformedRows += 1;
        continue;
      }
      const probeId = cells[indexes.ID].trim().replace(/^"|"$/g, "");
      const rawSymbols = cells[indexes["Gene.symbol"]].trim().replace(/^"|"$/g, "");
      const symbolTokens = rawSymbols.split("///").map((symbol) => symbol.trim()).filter(Boolean);
      const matchingGenes = genes.filter((gene) => symbolTokens.includes(gene));
      if (!matchingGenes.length) continue;

      targetRows += 1;
      const logFC = parseNumericCell(cells[indexes.logFC]);
      const adjP = parseNumericCell(cells[indexes["adj.P.Val"]]);
      const issues = [];
      if (!Number.isFinite(logFC)) issues.push("invalid or missing logFC");
      if (!Number.isFinite(adjP) || adjP < 0 || adjP > 1) issues.push("invalid or missing adjusted P-value");
      if (issues.length) {
        invalidRows.push({ probeId: probeId || `row ${lineNumber + 1}`, issues });
        continue;
      }
      const significant = Number.isFinite(adjP) && adjP < significanceThreshold;
      results.push({
        gene: matchingGenes.join(" / "),
        probeId,
        symbols: rawSymbols,
        logFC,
        adjP,
        significant,
        lineNumber: lineNumber + 1
      });
    }
    if (!targetRows) throw new Error("No exact matches for the eight research genes were found in Gene.symbol.");
    return {
      results,
      dataRows: lines.slice(1).filter((line) => line.trim()).length,
      invalidRows,
      malformedRows
    };
  }

  function formatNumber(value, digits = 4) {
    if (!Number.isFinite(value)) return "Not available";
    return value.toLocaleString("en-US", { maximumSignificantDigits: digits });
  }

  function compareValues(left, right, key) {
    if (key === "logFC" || key === "adjP") {
      const a = Number.isFinite(left[key]) ? left[key] : Number.POSITIVE_INFINITY;
      const b = Number.isFinite(right[key]) ? right[key] : Number.POSITIVE_INFINITY;
      return a - b;
    }
    if (key === "significance") return Number(left.significant) - Number(right.significant);
    return String(left[key]).localeCompare(String(right[key]), undefined, { numeric: true, sensitivity: "base" });
  }

  function updateSortIndicators() {
    document.querySelectorAll("th[data-sort-column]").forEach((header) => {
      const key = header.dataset.sortColumn;
      const active = key === sortKey;
      const direction = active ? (sortAscending ? "ascending" : "descending") : "none";
      header.setAttribute("aria-sort", direction);
      const button = header.querySelector("button");
      const mark = header.querySelector(".sort-mark");
      if (mark) mark.textContent = active ? String.fromCharCode(sortAscending ? 8593 : 8595) : String.fromCharCode(8597);
      if (button) button.setAttribute("aria-label", `Sort by ${sortLabels[key]}${active ? `, ${direction}` : ""}`);
    });
  }

  function makeCell(text, className) {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
  }

  function renderTable() {
    const selectedGene = elements.geneFilter.value;
    const query = elements.search.value.trim().toLocaleLowerCase();
    const visible = probeResults
      .filter((row) => selectedGene === "all" || row.gene.split(" / ").includes(selectedGene))
      .filter((row) => [row.gene, row.probeId, row.symbols].some((value) => value.toLocaleLowerCase().includes(query)))
      .sort((left, right) => compareValues(left, right, sortKey) * (sortAscending ? 1 : -1));

    elements.body.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const row of visible) {
      const tr = document.createElement("tr");
      tr.append(
        makeCell(row.gene, "gene-cell"),
        makeCell(row.probeId, "probe-cell"),
        makeCell(row.symbols || "Not available"),
        makeCell(formatNumber(row.logFC)),
        makeCell(formatNumber(row.adjP)),
        makeCell(row.significant ? "Adjusted P < 0.05" : "Not significant", `result-badge ${row.significant ? "significant" : "not-significant"}`)
      );
      fragment.append(tr);
    }
    elements.body.append(fragment);
    elements.count.textContent = `${visible.length} matching probe${visible.length === 1 ? "" : "s"}`;
    if (probeResults.length && !visible.length) {
      elements.message.hidden = false;
      elements.message.querySelector("p").textContent = "No probes match these filters. Try another gene or search term.";
    } else {
      elements.message.hidden = true;
    }
  }

  function loadFile(file) {
    if (!file) return;
    if (!/\.(tsv|txt)$/i.test(file.name)) {
      clearResults("Select a .tsv or .txt GEO2R results file before exploring probes.");
      elements.file.value = "";
      setStatus("Please choose a .tsv or .txt GEO2R results file.", "error");
      return;
    }
    clearResults("The selected TSV is being checked. No results will appear until its columns and target values are valid.");
    setStatus(`Reading ${file.name} locally...`, "loading");
    const reader = new FileReader();
    reader.onerror = () => {
      clearResults("The file could not be read. Choose a valid GEO2R TSV to display results.");
      setStatus("The selected file could not be read. Please try selecting it again.", "error");
    };
    reader.onload = () => {
      try {
        const parsed = parseTsv(String(reader.result || ""));
        probeResults = parsed.results;
        resetTableControls();
        elements.geneFilter.disabled = false;
        elements.search.disabled = false;
        if (probeResults.length) {
          elements.scroll.hidden = false;
          elements.message.hidden = true;
          renderTable();
        } else {
          elements.scroll.hidden = true;
          elements.message.hidden = false;
          elements.message.querySelector("p").textContent = "Exact target probes were found, but all had invalid or missing numerical values and were excluded.";
        }
        const warnings = [];
        if (parsed.invalidRows.length) warnings.push(`${parsed.invalidRows.length} target row${parsed.invalidRows.length === 1 ? "" : "s"} excluded for invalid or missing numerical values (${parsed.invalidRows.map((row) => row.probeId).join(", ")})`);
        if (parsed.malformedRows) warnings.push(`${parsed.malformedRows} malformed row${parsed.malformedRows === 1 ? "" : "s"} skipped because the column count did not match the header`);
        const summary = `Loaded ${parsed.dataRows.toLocaleString()} table rows and found ${probeResults.length} valid exact target-probe matches. No data leaves this browser.`;
        setStatus(warnings.length ? `${summary} Warning: ${warnings.join("; ")}.` : summary, warnings.length ? "warning" : "success");
      } catch (error) {
        clearResults("No results are shown until a correctly formatted GEO2R TSV is loaded.");
        setStatus(`Could not use this TSV: ${error.message}`, "error");
      }
    };
    reader.readAsText(file);
  }

  elements.file.addEventListener("change", (event) => loadFile(event.target.files[0]));
  elements.geneFilter.addEventListener("change", renderTable);
  elements.search.addEventListener("input", renderTable);
  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.sort;
      if (sortKey === nextKey) sortAscending = !sortAscending;
      else { sortKey = nextKey; sortAscending = true; }
      updateSortIndicators();
      renderTable();
    });
  });
  updateSortIndicators();

  elements.navToggle.addEventListener("click", () => {
    const isOpen = elements.nav.classList.toggle("is-open");
    elements.navToggle.setAttribute("aria-expanded", String(isOpen));
    elements.navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  elements.nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      elements.nav.classList.remove("is-open");
      elements.navToggle.setAttribute("aria-expanded", "false");
      elements.navToggle.setAttribute("aria-label", "Open navigation");
      elements.nav.querySelectorAll("a").forEach((item) => {
        item.classList.remove("is-active");
        item.removeAttribute("aria-current");
      });
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    });
  });
})();