"""
Professional PDF Report Generator using ReportLab
Produces comprehensive, publication-quality executive reports for datasets.
"""
import os
import io
import datetime
from typing import Dict, Any, List
import pandas as pd
import numpy as np

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Adds running headers and footers with page numbers"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AI Dataset Insight Platform — Executive Data Intelligence Report")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, f"Generated automatically on {datetime.date.today().strftime('%B %d, %Y')} | Confidential")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

class PDFReportGenerator:
    @staticmethod
    def generate_report(overview: Dict[str, Any], output_path: str) -> str:
        meta = overview.get("metadata", {})
        columns = overview.get("columns", [])
        num_cols = overview.get("numeric_columns", [])
        cat_cols = overview.get("categorical_columns", [])
        quality_score = overview.get("quality_score", 100.0)

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0f172a")
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#475569")
        )
        h1_style = ParagraphStyle(
            "Heading1",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "BodyDark",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#334155")
        )
        body_bold = ParagraphStyle(
            "BodyBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#0f172a")
        )
        table_cell = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#1e293b")
        )
        table_header = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=colors.white
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("AI DATASET INSIGHT PLATFORM", ParagraphStyle("Brand", fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#6366f1"), leading=12)))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"Dataset Intelligence Audit: {meta.get('name', 'Dataset')}", title_style))
        story.append(Spacer(1, 4))
        created_str = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p")
        story.append(Paragraph(f"File: <b>{meta.get('filename')}</b> | Generated: {created_str} | Status: {'Cleaned' if meta.get('is_cleaned') else 'Original'}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4f46e5"), spaceAfter=14))

        # 2. Executive KPI Summary Cards
        row_count = meta.get("row_count", 0)
        col_count = meta.get("col_count", 0)
        missing_total = meta.get("missing_total", 0)
        dup_rows = meta.get("duplicate_rows", 0)
        total_cells = (row_count * col_count) or 1
        missing_pct = round(missing_total / total_cells * 100, 2)
        dup_pct = round(dup_rows / row_count * 100, 2) if row_count > 0 else 0

        score_color = "#10b981" if quality_score >= 85 else ("#f59e0b" if quality_score >= 70 else "#ef4444")

        kpi_data = [
            [
                Paragraph(f"<b>DATA QUALITY SCORE</b><br/><font size='18' color='{score_color}'><b>{quality_score} / 100</b></font>", body_style),
                Paragraph(f"<b>TOTAL RECORDS</b><br/><font size='16' color='#0f172a'><b>{row_count:,}</b></font><br/><font size='8' color='#64748b'>Rows in dataset</font>", body_style),
                Paragraph(f"<b>TOTAL FEATURES</b><br/><font size='16' color='#0f172a'><b>{col_count}</b></font><br/><font size='8' color='#64748b'>{len(num_cols)} Num, {len(cat_cols)} Cat</font>", body_style),
            ],
            [
                Paragraph(f"<b>MISSING VALUES</b><br/><font size='14' color='{'#ef4444' if missing_total>0 else '#10b981'}'><b>{missing_total:,} ({missing_pct}%)</b></font>", body_style),
                Paragraph(f"<b>DUPLICATE ROWS</b><br/><font size='14' color='{'#f59e0b' if dup_rows>0 else '#10b981'}'><b>{dup_rows:,} ({dup_pct}%)</b></font>", body_style),
                Paragraph(f"<b>DATASET MEMORY</b><br/><font size='14' color='#0f172a'><b>{round(overview.get('memory_usage_bytes', 0)/1024, 1)} KB</b></font>", body_style),
            ]
        ]

        kpi_table = Table(kpi_data, colWidths=[168, 168, 168])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 14))

        # 3. Automated Executive Insights
        story.append(Paragraph("1. Executive Insights & Automated Audit Findings", h1_style))
        insights = []
        if quality_score >= 90:
            insights.append("• <b>High Integrity:</b> The dataset exhibits strong structural integrity with minimal data corruption or missing records.")
        elif quality_score >= 70:
            insights.append("• <b>Moderate Integrity:</b> The dataset is usable but contains missing entries or duplicates requiring automated cleaning.")
        else:
            insights.append("• <b>Data Hygiene Alert:</b> Elevated missing data or duplicate frequency detected. Recommended running data cleaning pipeline.")

        if missing_total > 0:
            insights.append(f"• <b>Missing Values Identified:</b> {missing_total:,} cells ({missing_pct}% of total dataset) contain null values across columns.")
        else:
            insights.append("• <b>Zero Missing Values:</b> All records are fully populated with zero missing data.")

        if dup_rows > 0:
            insights.append(f"• <b>Redundancy:</b> {dup_rows:,} duplicate rows were identified. De-duplication is advised before modeling.")
        else:
            insights.append("• <b>Unique Records:</b> 100% of rows represent distinct observations.")

        if num_cols:
            insights.append(f"• <b>Key Numerical Indicators:</b> Identified {len(num_cols)} continuous metrics suitable for statistical correlation and trend analysis: <i>{', '.join(num_cols[:5])}</i>.")

        for ins in insights:
            story.append(Paragraph(ins, body_style))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 10))

        # 4. Column Schema & Data Types Breakdown
        story.append(Paragraph("2. Column Metadata & Quality Distribution", h1_style))
        col_headers = [
            Paragraph("Column Name", table_header),
            Paragraph("Semantic Type", table_header),
            Paragraph("Distinct", table_header),
            Paragraph("Missing", table_header),
            Paragraph("Missing %", table_header),
            Paragraph("Sample Values", table_header),
        ]
        col_rows = [col_headers]
        for c in columns[:25]:  # limit to top 25 columns for PDF readability
            samples = ", ".join([str(x) for x in c.get("sample_values", [])[:3]])
            col_rows.append([
                Paragraph(f"<b>{c.get('name')}</b>", table_cell),
                Paragraph(c.get("semantic_type", "text"), table_cell),
                Paragraph(str(c.get("unique_count", 0)), table_cell),
                Paragraph(str(c.get("missing_count", 0)), table_cell),
                Paragraph(f"{c.get('missing_pct', 0.0)}%", table_cell),
                Paragraph(samples if samples else "-", table_cell)
            ])

        col_table = Table(col_rows, colWidths=[110, 75, 45, 45, 55, 174])
        col_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("ALIGN", (2, 0), (4, -1), "CENTER"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(col_table)
        story.append(Spacer(1, 14))

        # 5. Statistical Summary Table
        story.append(Paragraph("3. Parametric Statistical Summary (Numerical Features)", h1_style))
        num_stat_cols = [c for c in columns if c.get("semantic_type") == "numerical" and c.get("mean") is not None]
        if num_stat_cols:
            stat_headers = [
                Paragraph("Feature", table_header),
                Paragraph("Mean", table_header),
                Paragraph("Median", table_header),
                Paragraph("Std Dev", table_header),
                Paragraph("Min", table_header),
                Paragraph("Max", table_header),
                Paragraph("Outliers", table_header),
            ]
            stat_rows = [stat_headers]
            for c in num_stat_cols[:15]:
                stat_rows.append([
                    Paragraph(f"<b>{c.get('name')}</b>", table_cell),
                    Paragraph(f"{c.get('mean'):,.2f}" if c.get("mean") is not None else "-", table_cell),
                    Paragraph(f"{c.get('median'):,.2f}" if c.get("median") is not None else "-", table_cell),
                    Paragraph(f"{c.get('std'):,.2f}" if c.get("std") is not None else "-", table_cell),
                    Paragraph(f"{c.get('min'):,.2f}" if c.get("min") is not None else "-", table_cell),
                    Paragraph(f"{c.get('max'):,.2f}" if c.get("max") is not None else "-", table_cell),
                    Paragraph(str(c.get("outliers_count", 0)), table_cell),
                ])

            stat_table = Table(stat_rows, colWidths=[104, 66, 66, 66, 66, 66, 70])
            stat_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4338ca")),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(stat_table)
        else:
            story.append(Paragraph("No numerical columns available for statistical profiling.", body_style))

        story.append(Spacer(1, 14))

        # 6. Recommendation and Next Steps
        story.append(Paragraph("4. Recommended Analytical Actions", h1_style))
        story.append(Paragraph(
            "1. <b>Clean Data:</b> Apply missing value imputations and remove duplicate rows via the Data Cleaning module.<br/>"
            "2. <b>Explore Interactive Visualizations:</b> Navigate to the Visualizations tab to examine multi-dimensional relationships and distribution histograms.<br/>"
            "3. <b>Ask AI Chatbot:</b> Leverage the dataset-aware chatbot to query specific values, correlations, and conditional aggregations without writing SQL.",
            body_style
        ))

        # Build PDF
        doc.build(story, canvasmaker=NumberedCanvas)
        return output_path

# Global singleton
pdf_generator = PDFReportGenerator()

