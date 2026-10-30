# OncoMap

## Breast Cancer Bioinformatics Explorer

OncoMap is an educational research project exploring public breast-tissue gene-expression data. It brings together probe annotation, GEO2R differential-expression results, scientific visualisations and a small browser-based gene explorer. The project keeps array probe results separate so that multiple probes are not mistakenly treated as one gene-level measurement.

> **Research and education only. OncoMap is not a clinical diagnostic tool and must not be used to guide medical decisions.**

## Research Question

> How do selected breast cancer-associated gene-expression probes differ between normal breast tissue and breast cancer tissue?

## Research Objectives

- Describe the public GSE42568 dataset and its normal and cancer sample groups.
- Match selected GPL570 probe IDs to the eight research genes using exact gene-symbol tokens.
- Summarize the supplied GEO2R results at the probe level.
- Visualize the results with a volcano plot and a sample-level expression heatmap.
- Make the results explorable in a local browser without sending uploaded data to a server.

## Dataset

| Item | Description |
|---|---|
| GEO series | [GSE42568](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE42568) |
| Platform | [GPL570 - Affymetrix Human Genome U133 Plus 2.0 Array](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GPL570) |
| Organism | Human (*Homo sapiens*) |
| Samples | 121 total: 104 breast cancer tissue and 17 normal breast tissue |
| Measurement type | Microarray gene-expression measurements |

The project uses the GEO series matrix and the existing GEO2R results table. The matrix contains 54,675 probe rows. Its sample titles identify the normal and breast cancer groups. GEO describes the matrix measurements as GC-RMA processed. The raw CEL archive is not included in this project.

## Selected Genes

The eight selected research genes are:

**BRCA1, BRCA2, TP53, ERBB2, PIK3CA, ESR1, PTEN and EGFR.**

Together, this panel covers themes including DNA repair, cell-growth signalling, tumour suppression and hormone-receptor signalling. The panel is an exploratory selection, not a complete representation of breast cancer biology.

## Methods

### Probe Annotation

Probe IDs were looked up in the GPL570 annotation file. The `Gene symbol` field was split on `///`, and gene symbols were matched as exact tokens. This avoids treating a partial text match as an exact gene match. All 38 target probes were kept as separate rows. Probe `217492_s_at` is annotated to both `PTENP1` and `PTEN`, so its annotation is ambiguous.

### Differential Expression

The project summarizes the supplied GEO2R results; it does not rerun the analysis. GEO2R uses the limma framework to estimate differential expression. The reported adjusted P-values use the Benjamini-Hochberg procedure to account for multiple testing. The significance threshold used in this project is **adjusted P-value < 0.05**.

The matrix sample accessions and titles were used to align samples with their expression columns. Titles beginning with `Normal breast` define the 17-sample normal group; titles beginning with `Breast cancer` define the 104-sample cancer group. Positive logFC is interpreted as higher in cancer than normal for the supplied contrast; negative logFC is interpreted as lower in cancer.

## Exploratory Results

The GEO2R table contains **38 probes** associated with the selected genes. **18 probes** have adjusted P-values below 0.05: **14 have negative logFC and 4 have positive logFC** for cancer relative to normal.

| Gene | Target probes | Significant probes | Probe-level direction among significant results |
|---|---:|---:|---|
| BRCA1 | 2 | 0 | None |
| BRCA2 | 2 | 1 | 1 higher in cancer |
| TP53 | 2 | 1 | 1 higher in cancer |
| ERBB2 | 3 | 1 | 1 higher in cancer |
| PIK3CA | 3 | 3 | 3 lower in cancer |
| ESR1 | 9 | 1 | 1 higher in cancer |
| PTEN | 8 | 6 | 6 lower in cancer; one probe is also annotated to PTENP1 |
| EGFR | 9 | 5 | 5 lower in cancer |
| **Total** | **38** | **18** | **4 higher; 14 lower** |

These are **probe-level observations**, not conclusions that all eight genes are statistically significant or that each gene has one unified expression change. Probes for the same gene can differ in effect size, direction and significance. The PTEN/PTENP1-ambiguous probe should not be attributed uniquely to PTEN.

## Visualisations

- [Volcano plot](figures/volcano_plot.svg): all GEO2R probes, with logFC direction and adjusted-P threshold.
- [Gene-expression heatmap](figures/gene_expression_heatmap.svg): 38 separate probe rows across 17 normal and 104 cancer samples. Each row is standardized separately; its colors show relative values within that probe, not significance.

## Interactive Dashboard

Open [`dashboard/index.html`](dashboard/index.html) directly in Microsoft Edge. No server, Python, R, Node.js or external library is required.

In the Gene Explorer section, select `Data/processed/GSE42568.top.table.tsv` using the file picker. The dashboard reads the selected TSV locally in the browser, matches exact gene-symbol tokens, and displays the target probes. It does not automatically access local files and does not send the uploaded table to an external server.

## Limitations and Disclaimer

- The sample groups are imbalanced (104 cancer and 17 normal samples).
- This project summarizes one public cohort and supplied GEO2R results; it does not independently reproduce the study model or adjust for clinical and technical covariates.
- Microarray probes are platform-specific. Multiple probes can map to one gene, and an annotation can map one probe to multiple symbols.
- Adjusted-P significance is not the same as clinical importance. A non-significant result does not establish that no difference exists.
- The heatmap uses row-wise Z-scores, so its colors should not be used to compare absolute expression between different probes.
- The observations are exploratory and do not establish causation. Independent validation would be needed for stronger conclusions.

**OncoMap is for education and research exploration only. It cannot diagnose cancer and is not medical advice.**

## Project Structure

```text
OncoMap/
├── Data/
│   ├── annotation/
│   │   └── GPL570.annot.gz
│   ├── processed/
│   │   └── GSE42568.top.table.tsv
│   ├── raw/
│   │   └── GSE42568_series_matrix.txt.gz
│   ├── Processed_backup
│   └── Raw_backup
├── dashboard/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── figures/
│   ├── gene_expression_heatmap.svg
│   └── volcano_plot.svg
├── notebooks/                 (currently empty)
├── reports/
│   └── OncoMap_Research_Report.md
├── src/                       (currently empty)
└── README.md
```

The backup entries are existing files retained in `Data`; the working matrix and processed results are in the lowercase `raw/` and `processed/` folders.

## Official References

1. NCBI Gene Expression Omnibus. **GSE42568: Breast Cancer Gene Expression Analysis.** [Dataset record](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE42568).
2. NCBI Gene Expression Omnibus. **GPL570: Affymetrix Human Genome U133 Plus 2.0 Array.** [Platform record](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GPL570).
3. NCBI. **GEO2R: Analyze GEO data.** [GEO2R](https://www.ncbi.nlm.nih.gov/geo/geo2r/).
4. Ritchie ME, Phipson B, Wu D, Hu Y, Law CW, Shi W, Smyth GK. limma powers differential expression analyses for RNA-sequencing and microarray studies. *Nucleic Acids Research*. 2015;43(7):e47. [doi:10.1093/nar/gkv007](https://doi.org/10.1093/nar/gkv007).
5. Benjamini Y, Hochberg Y. Controlling the false discovery rate: a practical and powerful approach to multiple testing. *Journal of the Royal Statistical Society: Series B (Methodological)*. 1995;57(1):289-300. [doi:10.1111/j.2517-6161.1995.tb02031.x](https://doi.org/10.1111/j.2517-6161.1995.tb02031.x).
6. Wu Z, Irizarry RA, Gentleman R, Martinez-Murillo F, Spencer F. A model-based background adjustment for oligonucleotide expression arrays. *Journal of the American Statistical Association*. 2004;99(468):909-917. [doi:10.1198/016214504000000683](https://doi.org/10.1198/016214504000000683).
