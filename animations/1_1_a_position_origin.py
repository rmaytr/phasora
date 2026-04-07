"""
Manim animation for Concept 1.1a — Position depends on the Origin.

Render preview:   manim -pql animations/1_1_a_position_origin.py PositionAndOrigin
Render HD:        manim -pqh animations/1_1_a_position_origin.py PositionAndOrigin

After rendering, copy the output MP4 to:
  public/animations/1_1_a_position_origin.mp4

NOTE: This script uses only Text() (Pango renderer) — no LaTeX installation required.
"""

from manim import *

# ─── Phasora palette ──────────────────────────────────────────────────────────
BG_WHITE = "#FFFFFF"
AXES_GREY = "#94a3b8"
DOT_BLUE = "#1d4ed8"
ORIGIN_RED = "#dc2626"
TEXT_NAVY = "#0f172a"
LIGHT_GREY = "#64748b"


class PositionAndOrigin(Scene):
    def construct(self):
        self.camera.background_color = BG_WHITE

        # Layout constants
        line_y = 0
        line_left = -6
        line_right = 6
        unit = (line_right - line_left) / 10  # 10 units across screen
        # Object sits at a fixed physical screen position (3 units right of center)
        object_screen_x = 3 * unit  # physical screen position

        # ── Step 1 (0-3s): Build the scene ──────────────────────────────────
        # Number line
        number_line = Line(
            [line_left, line_y, 0], [line_right, line_y, 0],
            color=AXES_GREY, stroke_width=2.5,
        )

        # Tick marks at integer positions (-4 to +4 centered on screen)
        ticks = VGroup()
        for i in range(-4, 5):
            x = i * unit
            tick = Line(
                [x, line_y - 0.15, 0], [x, line_y + 0.15, 0],
                color=AXES_GREY, stroke_width=1.5,
            )
            ticks.add(tick)

        # Blue object dot (fixed physical position)
        obj_dot = Dot(
            [object_screen_x, line_y, 0],
            radius=0.15, color=DOT_BLUE, z_index=5,
        )
        obj_label = Text(
            "Object", font_size=16, color=TEXT_NAVY,
        ).next_to(obj_dot, UP, buff=0.2)

        # Dashed drop line from dot to number line
        drop_line = DashedLine(
            [object_screen_x, line_y + 0.6, 0],
            [object_screen_x, line_y, 0],
            color=DOT_BLUE, stroke_width=1.5,
            dash_length=0.08, stroke_opacity=0.5,
        )

        self.play(
            Create(number_line, run_time=0.8),
            FadeIn(ticks, run_time=0.8),
        )
        self.play(
            FadeIn(obj_dot, scale=1.3),
            FadeIn(obj_label),
            FadeIn(drop_line),
            run_time=0.8,
        )
        self.wait(0.4)

        # ── Helper: origin marker + bracket + label ──────────────────────────
        # These will be updated as origin moves.
        origin_x = ValueTracker(-2.5 * unit)  # start at left side

        # Origin marker: red vertical line
        origin_marker = always_redraw(lambda: Line(
            [origin_x.get_value(), line_y - 0.4, 0],
            [origin_x.get_value(), line_y + 0.4, 0],
            color=ORIGIN_RED, stroke_width=3,
        ))
        origin_zero = always_redraw(lambda: Text(
            "0", font_size=16, color=ORIGIN_RED, weight=BOLD,
        ).next_to(
            [origin_x.get_value(), line_y + 0.4, 0], UP, buff=0.1
        ))

        # Bracket arrow from origin to object
        def make_bracket():
            ox = origin_x.get_value()
            diff = object_screen_x - ox
            if abs(diff) < 0.05:
                # Nearly zero — show a tiny dot
                return Dot([object_screen_x, line_y - 0.6, 0], radius=0.03, color=DOT_BLUE)
            color = DOT_BLUE if diff > 0 else ORIGIN_RED
            arrow = Arrow(
                [ox, line_y - 0.6, 0],
                [object_screen_x, line_y - 0.6, 0],
                buff=0, color=color, stroke_width=2.5,
                max_tip_length_to_length_ratio=0.12,
            )
            return arrow

        bracket = always_redraw(make_bracket)

        # Position label near middle of bracket
        def make_pos_label():
            ox = origin_x.get_value()
            pos_val = (object_screen_x - ox) / unit
            sign = "+" if pos_val >= 0 else ""
            color = DOT_BLUE if pos_val >= 0 else ORIGIN_RED
            lbl = Text(
                f"x = {sign}{pos_val:.1f}",
                font_size=20, color=color, weight=BOLD,
            )
            mid_x = (ox + object_screen_x) / 2
            lbl.move_to([mid_x, line_y - 1.1, 0])
            return lbl

        pos_label = always_redraw(make_pos_label)

        # Tick labels relative to current origin
        def make_tick_labels():
            labels = VGroup()
            ox = origin_x.get_value()
            for i in range(-4, 5):
                x = i * unit
                val = (x - ox) / unit
                txt = Text(
                    f"{val:.0f}" if val == int(val) else f"{val:.1f}",
                    font_size=12, color=LIGHT_GREY,
                )
                txt.next_to([x, line_y + 0.15, 0], DOWN, buff=0.2)
                labels.add(txt)
            return labels

        tick_labels = always_redraw(make_tick_labels)

        # ── Step 2 (3-7s): First origin placement — origin at left ──────────
        self.play(
            FadeIn(origin_marker),
            FadeIn(origin_zero),
            FadeIn(tick_labels),
            run_time=0.6,
        )
        self.play(
            FadeIn(bracket),
            FadeIn(pos_label),
            run_time=0.6,
        )

        info_text = Text(
            "Position measured from this origin",
            font_size=16, color=TEXT_NAVY,
        ).to_edge(DOWN, buff=0.5)
        self.play(FadeIn(info_text), run_time=0.5)
        self.wait(1.5)

        # ── Step 3 (7-11s): Slide origin to under the dot ──────────────────
        self.play(FadeOut(info_text), run_time=0.3)

        self.play(
            origin_x.animate.set_value(object_screen_x),
            run_time=2.0,
            rate_func=smooth,
        )

        info_text_2 = Text(
            "Same dot. Different origin. x = 0.",
            font_size=18, color=TEXT_NAVY,
        ).to_edge(DOWN, buff=0.5)
        self.play(FadeIn(info_text_2), run_time=0.5)
        self.wait(1.5)

        # ── Step 4 (11-15s): Slide origin past the dot ─────────────────────
        self.play(FadeOut(info_text_2), run_time=0.3)

        self.play(
            origin_x.animate.set_value(object_screen_x + 2 * unit),
            run_time=2.0,
            rate_func=smooth,
        )

        info_text_3 = Text(
            "Now the dot is LEFT of zero. x is negative.",
            font_size=18, color=ORIGIN_RED,
        ).to_edge(DOWN, buff=0.5)
        self.play(FadeIn(info_text_3), run_time=0.5)
        self.wait(1.5)

        # ── Step 5 (15-18s): Summary ────────────────────────────────────────
        self.play(FadeOut(info_text_3), run_time=0.3)

        self.play(
            origin_x.animate.set_value(0),
            run_time=1.5,
            rate_func=smooth,
        )

        summary_text = Text(
            "Position is always relative to\nwhere you define zero.",
            font_size=20, color=TEXT_NAVY,
            line_spacing=1.4,
        ).to_edge(DOWN, buff=0.4)
        self.play(FadeIn(summary_text), run_time=0.6)
        self.wait(2.0)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=0.8,
        )
