from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
root=Path(__file__).resolve().parents[1]
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleA',fontName='Helvetica-Bold',fontSize=27,leading=30,textColor=colors.HexColor('#213480'),spaceAfter=12))
styles.add(ParagraphStyle(name='SubtitleA',fontName='Helvetica-Bold',fontSize=15,leading=19,textColor=colors.HexColor('#162c29'),spaceAfter=14))
styles.add(ParagraphStyle(name='HeadA',fontName='Helvetica-Bold',fontSize=11.5,leading=15,spaceBefore=12,spaceAfter=6,textColor=colors.HexColor('#162c29')))
styles.add(ParagraphStyle(name='BodyA',fontName='Helvetica',fontSize=9.4,leading=13.2,spaceAfter=7))
styles.add(ParagraphStyle(name='CellA',fontName='Helvetica',fontSize=8.5,leading=11.5,spaceAfter=0,wordWrap='CJK'))
styles.add(ParagraphStyle(name='CellH',parent=styles['CellA'],fontName='Helvetica-Bold',textColor=colors.white))
def para(t,s='BodyA'):return Paragraph(escape(t).replace('`',''),styles[s])
def deco(c,d):
    w,h=A4;c.setFillColor(colors.HexColor('#162c29'));c.rect(0,h-36,w,36,fill=1,stroke=0)
    c.setFillColor(colors.HexColor('#d9ee73'));c.setFont('Helvetica-Bold',10);c.drawString(42,h-23,'ALISTA')
    c.setFillColor(colors.white);c.setFont('Helvetica',8);c.drawRightString(w-42,h-23,'PERSONALIZACIÓN Y ACOMPAÑAMIENTO')
    c.setFillColor(colors.HexColor('#666666'));c.setFont('Helvetica',8);c.drawString(42,25,'05.09.2026  |  '+d.label);c.drawRightString(w-42,25,str(d.page))
def build(src,out,label):
    lines=(root/src).read_text().splitlines();story=[];i=0
    while i<len(lines):
        line=lines[i].strip();i+=1
        if not line:continue
        if line=='---PAGE---':story.append(PageBreak());continue
        if line.startswith('|'):
            rows=[line]
            while i<len(lines) and lines[i].strip().startswith('|'):rows.append(lines[i].strip());i+=1
            cells=[[c.strip() for c in r.strip('|').split('|')] for r in rows if not set(r.replace('|','').replace(' ','')).issubset(set('-:'))]
            n=len(cells[0]);width=A4[0]-84
            widths=([width*.32,width*.68] if n==2 else [width*.25,width*.49,width*.26])
            data=[[para(v,'CellH' if j==0 else 'CellA') for v in row] for j,row in enumerate(cells)]
            t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
            t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#162c29')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f0eee8'),colors.HexColor('#faf9f6')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,0),1,colors.HexColor('#d9ee73'))]));story += [t,Spacer(1,10)];continue
        if line.startswith('### '):story.append(para(line[4:],'HeadA'))
        elif line.startswith('## '):story.append(para(line[3:],'SubtitleA'))
        elif line.startswith('# '):story.append(para(line[2:],'TitleA'))
        else:story.append(para(line))
    doc=SimpleDocTemplate(str(root/out),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=58,bottomMargin=45,title=label,author='Alista');doc.label=label;doc.build(story,onFirstPage=deco,onLaterPages=deco)
build('docs/comercial/PRESUPUESTO_MODELO_ACOMPANAMIENTO.md','output/pdf/alista-presupuesto-modelo.pdf','Propuesta editable para futuras familias')
# Este documento privado sólo existe en la estación de trabajo del owner.
if (root/'docs/operacion/PROTOCOLO_EVENTO_Y_EVIDENCIA.md').exists():
    build('docs/operacion/PROTOCOLO_EVENTO_Y_EVIDENCIA.md','output/pdf/alista-protocolo-alfonsina.pdf','Alfonsina | Protocolo interno y evidencia')
