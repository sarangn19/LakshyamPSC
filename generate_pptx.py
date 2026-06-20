from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Colors
BG_DARK = RGBColor(0x0F, 0x0F, 0x0F)
BG_CARD = RGBColor(0x1A, 0x1A, 0x2E)
PURPLE = RGBColor(0xA7, 0x8B, 0xFA)
PURPLE_LIGHT = RGBColor(0xC4, 0xB5, 0xFD)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GRAY = RGBColor(0x88, 0x88, 0x88)
GRAY_LIGHT = RGBColor(0xCC, 0xCC, 0xCC)
GREEN = RGBColor(0x34, 0xD3, 0x99)
YELLOW = RGBColor(0xFB, 0xBF, 0x24)
RED = RGBColor(0xFB, 0x71, 0x85)
BORDER = RGBColor(0x2A, 0x2A, 0x3E)

def set_bg(slide, color=BG_DARK):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_rect(slide, left, top, width, height, fill_color, border_color=None, radius=0):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape

def add_text_box(slide, left, top, width, height, text, font_size=18, color=WHITE, bold=False, alignment=PP_ALIGN.LEFT, font_name='Calibri'):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    return txBox

def add_paragraph(tf, text, font_size=16, color=GRAY_LIGHT, bold=False, space_before=6, alignment=PP_ALIGN.LEFT):
    p = tf.add_paragraph()
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = 'Calibri'
    p.space_before = Pt(space_before)
    p.alignment = alignment

def add_card(slide, left, top, width, height, title, body, title_color=PURPLE):
    card = add_rect(slide, left, top, width, height, BG_CARD, BORDER, radius=8)
    add_text_box(slide, left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), Inches(0.4), title, 14, title_color, True)
    add_text_box(slide, left + Inches(0.2), top + Inches(0.5), width - Inches(0.4), height - Inches(0.65), body, 12, GRAY_LIGHT)

def slide_number(slide, num, total):
    add_text_box(slide, Inches(12.2), Inches(7.0), Inches(1), Inches(0.4), f"{num}/{total}", 10, GRAY, alignment=PP_ALIGN.RIGHT)

def add_bullet_list(slide, left, top, width, height, items, color=GRAY_LIGHT, font_size=12):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = "\u25b8  {}".format(item)
        p.font.size = Pt(font_size)
        p.font.color.rgb = color
        p.font.name = 'Calibri'
        p.space_before = Pt(4)
    return txBox

TOTAL = 14

# ═══════════════════════════════════════════
# SLIDE 1: Title
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(1.5), Inches(2.2), Inches(10), Inches(1.5), "Lakshyam", 72, PURPLE, True, PP_ALIGN.CENTER)
add_text_box(slide, Inches(1.5), Inches(3.6), Inches(10), Inches(0.8), "AI-Powered Kerala PSC Preparation", 28, PURPLE_LIGHT, False, PP_ALIGN.CENTER)
add_text_box(slide, Inches(1.5), Inches(4.8), Inches(10), Inches(0.5), "Personalized learning for every aspirant.", 18, GRAY, False, PP_ALIGN.CENTER)
add_text_box(slide, Inches(1.5), Inches(6.2), Inches(10), Inches(0.4), "Investor Pitch  |  June 2026", 12, RGBColor(0x55,0x55,0x55), False, PP_ALIGN.CENTER)
slide_number(slide, 1, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 2: The Problem
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "The Problem", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "PSC preparation is broken.", 36, WHITE, True)
add_card(slide, Inches(0.8), Inches(1.8), Inches(5.8), Inches(2.5), "?  Unknown Path", "Students don't know what to study next. Without a personalized roadmap, they waste time on random topics.")
add_card(slide, Inches(6.8), Inches(1.8), Inches(5.8), Inches(2.5), "?  Wasted Repetition", "They practice what they already know. Time is spent on familiar topics instead of weak areas.")
add_card(slide, Inches(0.8), Inches(4.6), Inches(5.8), Inches(2.5), "?  The Forgetting Curve", "Concepts learned weeks ago are forgotten. No system reminds students what they're about to lose.")
add_card(slide, Inches(6.8), Inches(4.6), Inches(5.8), Inches(2.5), "?  No Guidance", "No personalized feedback. No tutor who understands their specific gaps. Just static question banks.")
slide_number(slide, 2, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 3: Market Opportunity
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Market Opportunity", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(11), Inches(0.6), "One of India's largest recruitment ecosystems", 36, WHITE, True)
add_text_box(slide, Inches(0.8), Inches(1.5), Inches(11), Inches(0.5), "Kerala PSC is among the largest state recruitment ecosystems in India. Hundreds of thousands of candidates compete for government jobs every year.", 14, GRAY)

stats_data = [
    ("500K+", "Active aspirants/year"),
    ("5+", "Exam types"),
    ("10,000+", "Coaching centers"),
    ("96%", "Kerala literacy rate"),
    ("80%+", "Smartphone penetration"),
    ("0", "Dedicated PSC apps"),
]
for i, (num, label) in enumerate(stats_data):
    col = i % 3
    row = i // 3
    x = Inches(1.5 + col * 3.8)
    y = Inches(2.3 + row * 2.3)
    shape = add_rect(slide, x, y, Inches(3.2), Inches(1.8), BG_CARD, BORDER, radius=8)
    add_text_box(slide, x, y + Inches(0.2), Inches(3.2), Inches(0.8), num, 42, PURPLE, True, PP_ALIGN.CENTER)
    add_text_box(slide, x, y + Inches(1.0), Inches(3.2), Inches(0.6), label, 13, GRAY_LIGHT, False, PP_ALIGN.CENTER)

add_text_box(slide, Inches(1.5), Inches(6.5), Inches(10), Inches(0.5), "The market is ready. The product doesn't exist yet.", 18, PURPLE_LIGHT, True, PP_ALIGN.CENTER)
slide_number(slide, 3, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 4: Why Existing Solutions Fail
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Competition", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Why existing solutions fail", 36, WHITE, True)
add_text_box(slide, Inches(0.8), Inches(1.5), Inches(11), Inches(0.4), "Every student receives the same content. No solution adapts to individual learning needs.", 14, GRAY)

headers = ["", "Books", "Coaching", "Apps"]
col_widths = [Inches(3.5), Inches(2.5), Inches(2.5), Inches(2.5)]
x_start = Inches(1.2)
y_start = Inches(2.2)
row_h = Inches(0.6)

x = x_start
for j, (h, w) in enumerate(zip(headers, col_widths)):
    shape = add_rect(slide, x, y_start, w, row_h, PURPLE, None)
    tf = shape.text_frame
    p = tf.paragraphs[0]
    p.text = h
    p.font.size = Pt(13)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.font.name = 'Calibri'
    p.alignment = PP_ALIGN.CENTER
    x += w

rows_data = [
    ("Personalized", "No", "No", "No"),
    ("Adaptive", "No", "No", "No"),
    ("Affordable", "Yes", "No", "Yes"),
    ("Malayalam support", "Yes", "Yes", "No"),
    ("Always fresh content", "No", "No", "No"),
]
for i, row_data in enumerate(rows_data):
    x = x_start
    y = y_start + row_h * (i + 1)
    bg = BG_CARD if i % 2 == 0 else RGBColor(0x15, 0x15, 0x28)
    for j, (val, w) in enumerate(zip(row_data, col_widths)):
        shape = add_rect(slide, x, y, w, row_h, bg, BORDER)
        tf = shape.text_frame
        p = tf.paragraphs[0]
        p.text = val
        p.font.size = Pt(13)
        color = GRAY_LIGHT if j == 0 else (GREEN if val == "Yes" else RED)
        p.font.color.rgb = color
        p.font.bold = (j == 0)
        p.font.name = 'Calibri'
        p.alignment = PP_ALIGN.CENTER
        x += w
slide_number(slide, 4, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 5: Lakshyam
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "The Solution", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(11), Inches(0.6), "The first AI-native learning platform built specifically for Kerala PSC", 32, WHITE, True)

pillars = [
    ("Personalized Practice", "AI generates unique questions matched to your exact weak areas \u2014 not generic question banks"),
    ("Malayalam AI Tutor", "Ask anything in Malayalam or English. Explains concepts, creates practice, clarifies doubts."),
    ("Adaptive Revision", "Knows what you're about to forget and schedules review before you do. Spaced repetition built in."),
]
for i, (title, body) in enumerate(pillars):
    x = Inches(0.8 + i * 4.1)
    add_card(slide, x, Inches(2.2), Inches(3.8), Inches(3.5), title, body)
slide_number(slide, 5, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 6: Product Flow
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "How It Works", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Product Flow", 36, WHITE, True)

flow_items = ["Practice", "Detect\nWeakness", "Recommend\nNext Topic", "Generate\nRevision", "Improve\nRetention"]
box_w = Inches(2.0)
box_h = Inches(1.0)
gap = Inches(0.2)
start_x = Inches(0.6)
start_y = Inches(2.5)
for i, item in enumerate(flow_items):
    x = start_x + i * (box_w + gap)
    shape = add_rect(slide, x, start_y, box_w, box_h, BG_CARD, PURPLE, radius=8)
    tf = shape.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = item
    p.font.size = Pt(12)
    p.font.color.rgb = PURPLE_LIGHT
    p.font.name = 'Calibri'
    p.font.bold = True
    p.alignment = PP_ALIGN.CENTER
    if i < len(flow_items) - 1:
        add_text_box(slide, x + box_w, start_y + Inches(0.3), Inches(0.3), Inches(0.4), "\u2192", 18, GRAY, False, PP_ALIGN.CENTER)

add_text_box(slide, Inches(1.5), Inches(4.0), Inches(10), Inches(0.8), '"Every interaction trains the model. No two students see the same path."', 20, PURPLE_LIGHT, False, PP_ALIGN.CENTER)
slide_number(slide, 6, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 7: Why We Win - Data Moat
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Moat", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Why We Win", 36, WHITE, True)
add_text_box(slide, Inches(0.8), Inches(1.5), Inches(11), Inches(0.4), "Every interaction creates learning data. This is a network-effects data moat that compounds over time.", 14, GRAY)

cycle_steps = ["More students", "Better understanding of PSC learning patterns", "Better recommendations", "Better outcomes", "More students -> cycle repeats"]
cycle_colors = [PURPLE_LIGHT, PURPLE_LIGHT, PURPLE_LIGHT, PURPLE_LIGHT, GREEN]
for i, (step, clr) in enumerate(zip(cycle_steps, cycle_colors)):
    y = Inches(2.2 + i * 0.85)
    shape = add_rect(slide, Inches(3.5), y, Inches(6.5), Inches(0.65), BG_CARD, clr, radius=6)
    tf = shape.text_frame
    p = tf.paragraphs[0]
    p.text = step
    p.font.size = Pt(14)
    p.font.color.rgb = clr
    p.font.bold = True
    p.font.name = 'Calibri'
    p.alignment = PP_ALIGN.CENTER
    if i < len(cycle_steps) - 1:
        add_text_box(slide, Inches(5.8), y + Inches(0.65), Inches(2), Inches(0.3), "\u25bc", 12, GRAY, False, PP_ALIGN.CENTER)

add_card(slide, Inches(0.8), Inches(6.0), Inches(5.8), Inches(1.2), "What we continuously map", "What each student knows · What they're forgetting · What they should learn next")
add_card(slide, Inches(6.8), Inches(6.0), Inches(5.8), Inches(1.2), "The result", "Higher retention · Faster exam readiness · Competitors can't replicate years of learning data")
slide_number(slide, 7, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 8: Competitive Positioning
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Positioning", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Competitive Positioning", 36, WHITE, True)

pos_headers = ["Capability", "Lakshyam", "Others"]
pos_col_w = [Inches(4.5), Inches(3.0), Inches(3.0)]
px = Inches(1.5)
py = Inches(2.0)
prh = Inches(0.7)

for j, (h, w) in enumerate(zip(pos_headers, pos_col_w)):
    x = px + sum(pos_col_w[k] for k in range(j))
    shape = add_rect(slide, x, py, w, prh, PURPLE, None)
    tf = shape.text_frame
    p = tf.paragraphs[0]
    p.text = h
    p.font.size = Pt(14)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.font.name = 'Calibri'
    p.alignment = PP_ALIGN.CENTER

pos_rows = [
    ("Kerala PSC Focus", "Yes", "Partial"),
    ("Malayalam AI Tutor", "Yes", "Limited"),
    ("Adaptive Learning", "Yes", "Rare"),
    ("Personalized Revision", "Yes", "No"),
]
for i, row in enumerate(pos_rows):
    y = py + prh * (i + 1)
    bg = BG_CARD if i % 2 == 0 else RGBColor(0x15, 0x15, 0x28)
    for j, (val, w) in enumerate(zip(row, pos_col_w)):
        x = px + sum(pos_col_w[k] for k in range(j))
        shape = add_rect(slide, x, y, w, prh, bg, BORDER)
        tf = shape.text_frame
        p = tf.paragraphs[0]
        p.text = val
        p.font.size = Pt(14)
        if j == 1 and val == "Yes":
            p.font.color.rgb = GREEN
            p.font.bold = True
        elif j == 2:
            p.font.color.rgb = YELLOW if val in ("Partial", "Limited") else RED
        else:
            p.font.color.rgb = GRAY_LIGHT
        p.font.name = 'Calibri'
        p.alignment = PP_ALIGN.CENTER
        x += w
slide_number(slide, 8, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 9: Business Model
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Monetization", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Business Model", 36, WHITE, True)

biz_cards = [
    ("Free", "AI-generated questions\nBasic analytics\nDaily current affairs", "Rs.0", GREEN),
    ("Premium", "Unlimited questions\nOffline question bank\nPriority AI generation\nDetailed analytics\nAd-free", "Rs.199/mo", YELLOW),
]
for i, (title, features, price, color) in enumerate(biz_cards):
    x = Inches(1.5 + i * 5.5)
    add_card(slide, x, Inches(1.8), Inches(4.8), Inches(3.0), title, features)
    add_text_box(slide, x, Inches(4.8), Inches(4.8), Inches(0.6), price, 28, color, True, PP_ALIGN.CENTER)

add_card(slide, Inches(0.8), Inches(5.5), Inches(11.8), Inches(1.5), "Unit Economics", "")
unit_items = [
    "AI inference cost per question: ~Rs.0.001 (free tier Groq+Gemini -> Rs.0)",
    "Premium at Rs.199/mo with 300 questions/user = Rs.0.30 AI cost -> 99.85% gross margin",
    "Even with GPT-4o-mini upgrade: Rs.5/user/mo -> 97.5% margin",
    "Coaching centers charge Rs.15,000-50,000/year per student",
]
add_bullet_list(slide, Inches(1.1), Inches(5.9), Inches(11.3), Inches(1.2), unit_items, GRAY_LIGHT, 11)
slide_number(slide, 9, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 10: Go-To-Market
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Distribution", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Go-To-Market", 36, WHITE, True)

gtm = [
    ("PSC Telegram Groups", "Largest organic community of active aspirants. Direct access to target users at zero cost."),
    ("YouTube Creators", "Partner with PSC-focused YouTube creators for reviews, tutorials, and referral campaigns."),
    ("Campus Ambassadors", "College students preparing for PSC as brand advocates. Peer-driven organic growth."),
    ("Referral Program", "Viral growth through aspirant networks. Each user brings 2-3 peers preparing for same exams."),
]
for i, (title, body) in enumerate(gtm):
    col = i % 2
    row = i // 2
    x = Inches(0.8 + col * 6.3)
    y = Inches(1.8 + row * 2.5)
    add_card(slide, x, y, Inches(5.8), Inches(2.2), title, body)

add_card(slide, Inches(0.8), Inches(6.0), Inches(11.8), Inches(1.1), "Coaching Partnerships", "White-label solution for 10,000+ coaching centers in Kerala. Reach their existing student base.")
slide_number(slide, 10, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 11: Traction
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Progress", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Traction", 36, WHITE, True)

traction = [
    ("Working MVP", "Live on Vercel. Full AI question generation pipeline operational."),
    ("AI Question Generation", "1,500+ questions per day free capacity. Multi-provider pipeline ensures uptime."),
    ("Mobile App Prototype", "iOS + Android + Web from a single React Native codebase. Offline-first."),
    ("Admin Dashboard", "Content management, analytics, learner support, current affairs publishing."),
]
for i, (title, body) in enumerate(traction):
    col = i % 2
    row = i // 2
    x = Inches(0.8 + col * 6.3)
    y = Inches(1.8 + row * 2.2)
    add_card(slide, x, y, Inches(5.8), Inches(1.8), title, body)

add_text_box(slide, Inches(0.8), Inches(6.3), Inches(11), Inches(0.4), "Next: Play Store / App Store launch  ·  Premium features  ·  Coaching center partnerships", 14, YELLOW, False, PP_ALIGN.CENTER)
slide_number(slide, 11, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 12: Vision
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Vision", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(11), Inches(0.6), "From Kerala PSC to India's exam prep platform", 36, WHITE, True)

phases = [
    ("Phase 1", "Kerala PSC", "LDC, Secretariat Assistant, University Assistant, Police, Degree Level"),
    ("Phase 2", "Other State PSCs", "Tamil Nadu PSC  ·  Karnataka PSC"),
    ("Phase 3", "National Exams", "SSC  ·  Railway  ·  Banking  ·  UPSC"),
]
phase_colors = [PURPLE_LIGHT, YELLOW, GREEN]
for i, (title, phase_name, desc) in enumerate(phases):
    x = Inches(0.8 + i * 4.1)
    add_card(slide, x, Inches(2.0), Inches(3.8), Inches(4.0), title, desc)
    add_text_box(slide, x + Inches(0.2), Inches(4.5), Inches(3.4), Inches(0.5), phase_name, 18, phase_colors[i], True, PP_ALIGN.CENTER)
slide_number(slide, 12, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 13: Why Now
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(6), Inches(0.4), "Timing", 14, PURPLE, True)
add_text_box(slide, Inches(0.8), Inches(0.9), Inches(10), Inches(0.6), "Why Now?", 36, WHITE, True)

why = [
    ("AI Cost Collapse", "99.85%", "High-quality educational content can now be generated at near-zero cost. This wasn't possible 2 years ago."),
    ("Regional-Language Boom", "96%", "Malayalam digital content consumption is growing rapidly. Students expect content in their own language."),
    ("Personalization Expectation", "New", "Students expect personalized feeds (Instagram, YouTube, Netflix). They now expect the same from education."),
]
why_colors = [PURPLE, YELLOW, RGBColor(0x60, 0xA5, 0xFA)]
for i, (title, stat, body) in enumerate(why):
    x = Inches(0.8 + i * 4.1)
    add_card(slide, x, Inches(1.8), Inches(3.8), Inches(4.5), title, "")
    add_text_box(slide, x, Inches(2.5), Inches(3.8), Inches(0.8), stat, 36, why_colors[i], True, PP_ALIGN.CENTER)
    add_text_box(slide, x + Inches(0.2), Inches(3.5), Inches(3.4), Inches(2.5), body, 12, GRAY_LIGHT)

add_text_box(slide, Inches(0.8), Inches(6.6), Inches(11), Inches(0.5), "The window to establish a regional-language AI learning platform is now.", 18, PURPLE_LIGHT, True, PP_ALIGN.CENTER)
slide_number(slide, 13, TOTAL)

# ═══════════════════════════════════════════
# SLIDE 14: Thank You
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text_box(slide, Inches(1.5), Inches(2.5), Inches(10), Inches(1.5), "Thank You", 72, PURPLE, True, PP_ALIGN.CENTER)
add_text_box(slide, Inches(1.5), Inches(4.0), Inches(10), Inches(0.8), "Lakshyam \u2014 AI-Powered Kerala PSC Preparation", 28, PURPLE_LIGHT, False, PP_ALIGN.CENTER)
add_text_box(slide, Inches(1.5), Inches(5.2), Inches(10), Inches(0.5), "Built by a solo developer  \u00b7  React Native + Supabase + Vercel", 16, GRAY, False, PP_ALIGN.CENTER)
slide_number(slide, 14, TOTAL)

# Save
prs.save('Lakshyam_Investor_Pitch.pptx')
print("Saved: Lakshyam_Investor_Pitch.pptx")
