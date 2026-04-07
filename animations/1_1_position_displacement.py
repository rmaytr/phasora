"""
Manim animation for Concept 1.1 — Position, Displacement & Distance.

Render preview:   manim -pql animations/1_1_position_displacement.py PositionDisplacement
Render HD:        manim -pqh animations/1_1_position_displacement.py PositionDisplacement

After rendering, copy the output MP4 to:
  public/animations/1_1_position_displacement.mp4

NOTE: This script uses only Text() (Pango renderer) — no LaTeX installation required.
"""

from manim import *

# ─── Phasora palette ──────────────────────────────────────────────────────────
BG_WHITE = "#FFFFFF"
AXES_GREY = "#94a3b8"
PHASORA_BLUE = "#1d4ed8"
DISPLACEMENT_GREEN = "#16a34a"
COMP_RED = "#dc2626"
COMP_ORANGE = "#d97706"
TEXT_NAVY = "#0f172a"


def make_number_labels(axes, axis="x", color=AXES_GREY, font_size=16):
    """Add axis number labels using Text (Pango) instead of MathTex (LaTeX)."""
    labels = VGroup()
    if axis == "x":
        rng = range(int(axes.x_range[0]), int(axes.x_range[1]) + 1)
        for val in rng:
            if val == 0:
                continue
            lbl = Text(str(val), font_size=font_size, color=color)
            lbl.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            labels.add(lbl)
    else:
        rng = range(int(axes.y_range[0]), int(axes.y_range[1]) + 1)
        for val in rng:
            if val == 0:
                continue
            lbl = Text(str(val), font_size=font_size, color=color)
            lbl.next_to(axes.c2p(0, val), LEFT, buff=0.15)
            labels.add(lbl)
    return labels


class PositionDisplacement(Scene):
    def construct(self):
        self.camera.background_color = BG_WHITE

        # ── ACT 1: Coordinate system (~3 s) ──────────────────────────────────
        axes = Axes(
            x_range=[-4, 5, 1],
            y_range=[-1, 4, 1],
            x_length=9,
            y_length=5,
            axis_config={
                "color": AXES_GREY,
                "stroke_width": 2,
                "include_ticks": True,
                "tick_size": 0.08,
                "include_numbers": False,  # we add Pango labels manually
            },
            tips=False,
        )

        # Light grid behind axes
        grid = NumberPlane(
            x_range=[-4, 5, 1],
            y_range=[-1, 4, 1],
            x_length=9,
            y_length=5,
            background_line_style={
                "stroke_color": AXES_GREY,
                "stroke_width": 0.5,
                "stroke_opacity": 0.35,
            },
            axis_config={"stroke_opacity": 0},
            faded_line_style={"stroke_opacity": 0},
        )
        grid.move_to(axes.get_center())

        x_labels = make_number_labels(axes, "x")
        y_labels = make_number_labels(axes, "y")

        origin_dot = Dot(axes.c2p(0, 0), radius=0.06, color=TEXT_NAVY)
        origin_label = Text(
            "Origin (0, 0)",
            font_size=18,
            color=TEXT_NAVY,
        ).next_to(origin_dot, DOWN + LEFT, buff=0.15)

        self.play(FadeIn(grid, run_time=0.8))
        self.play(Create(axes, run_time=1.2))
        self.play(
            FadeIn(x_labels), FadeIn(y_labels),
            FadeIn(origin_dot), FadeIn(origin_label),
            run_time=0.8,
        )
        self.wait(0.2)

        # ── ACT 2: Introducing Position (~4 s) ──────────────────────────────
        obj_dot = Dot(axes.c2p(0, 0), radius=0.1, color=PHASORA_BLUE, z_index=5)
        self.play(FadeIn(obj_dot, scale=1.5), run_time=0.5)

        target_pos = axes.c2p(3, 1)

        # Dashed trace from origin to dot (updates as dot moves)
        trace_line = DashedLine(
            axes.c2p(0, 0), axes.c2p(0, 0),
            color=PHASORA_BLUE,
            stroke_width=1.5,
            stroke_opacity=0.5,
            dash_length=0.1,
        )
        trace_line.add_updater(
            lambda m: m.become(
                DashedLine(
                    axes.c2p(0, 0),
                    obj_dot.get_center(),
                    color=PHASORA_BLUE,
                    stroke_width=1.5,
                    stroke_opacity=0.5,
                    dash_length=0.1,
                )
            )
        )
        self.add(trace_line)

        self.play(
            obj_dot.animate(rate_func=smooth).move_to(target_pos),
            run_time=1.5,
        )
        trace_line.clear_updaters()

        coord_label_1 = Text(
            "x = 3, y = 1",
            font_size=18,
            color=TEXT_NAVY,
        ).next_to(obj_dot, UP + RIGHT, buff=0.15)

        pos_vector = Arrow(
            axes.c2p(0, 0), target_pos,
            buff=0,
            color=PHASORA_BLUE,
            stroke_width=3,
            max_tip_length_to_length_ratio=0.15,
        )
        pos_label = Text(
            "position vector r",
            font_size=16,
            color=PHASORA_BLUE,
        ).next_to(pos_vector.get_center(), DOWN + RIGHT, buff=0.12)

        self.play(FadeIn(coord_label_1), run_time=0.4)
        self.play(GrowArrow(pos_vector), FadeIn(pos_label), run_time=1.0)
        self.wait(0.6)

        # ── ACT 3: Moving to new position (~4 s) ────────────────────────────
        ghost_dot = Dot(axes.c2p(3, 1), radius=0.06, color=AXES_GREY, z_index=3)
        ghost_label = Text(
            "start",
            font_size=14,
            color=AXES_GREY,
        ).next_to(ghost_dot, DOWN, buff=0.12)

        new_target = axes.c2p(-1, 2)

        self.play(
            FadeIn(ghost_dot),
            FadeIn(ghost_label),
            FadeOut(coord_label_1),
            FadeOut(trace_line),
            run_time=0.5,
        )

        new_pos_vector = Arrow(
            axes.c2p(0, 0), new_target,
            buff=0,
            color=PHASORA_BLUE,
            stroke_width=3,
            max_tip_length_to_length_ratio=0.15,
        )
        new_pos_label = Text(
            "position vector r",
            font_size=16,
            color=PHASORA_BLUE,
        ).next_to(new_pos_vector.get_center(), UP + LEFT, buff=0.12)

        self.play(
            obj_dot.animate(rate_func=smooth).move_to(new_target),
            ReplacementTransform(pos_vector, new_pos_vector),
            ReplacementTransform(pos_label, new_pos_label),
            run_time=1.8,
        )

        coord_label_2 = Text(
            "x = -1, y = 2",
            font_size=18,
            color=TEXT_NAVY,
        ).next_to(obj_dot, UP + LEFT, buff=0.15)

        self.play(FadeIn(coord_label_2), run_time=0.4)
        self.wait(0.8)

        # ── ACT 4: Showing Displacement (~5 s) ──────────────────────────────
        start_pt = axes.c2p(3, 1)
        end_pt = axes.c2p(-1, 2)

        disp_arrow = Arrow(
            start_pt, end_pt,
            buff=0,
            color=DISPLACEMENT_GREEN,
            stroke_width=4,
            max_tip_length_to_length_ratio=0.12,
        )
        disp_label = Text(
            "displacement",
            font_size=18,
            color=DISPLACEMENT_GREEN,
        ).next_to(disp_arrow.get_center(), UP, buff=0.18)

        self.play(GrowArrow(disp_arrow), FadeIn(disp_label), run_time=1.0)

        # Component arrows
        mid_pt = axes.c2p(-1, 1)  # corner of the right-angle triangle

        dx_arrow = DashedLine(
            start_pt, mid_pt,
            color=COMP_RED,
            stroke_width=2.5,
            dash_length=0.1,
        ).add_tip(tip_length=0.15)
        dy_arrow = DashedLine(
            mid_pt, end_pt,
            color=COMP_ORANGE,
            stroke_width=2.5,
            dash_length=0.1,
        ).add_tip(tip_length=0.15)

        dx_text = Text(
            "dx = -1 - 3 = -4",
            font_size=14,
            color=COMP_RED,
        ).next_to(dx_arrow, DOWN, buff=0.12)

        dy_text = Text(
            "dy = 2 - 1 = 1",
            font_size=14,
            color=COMP_ORANGE,
        ).next_to(dy_arrow, RIGHT, buff=0.12)

        self.play(
            Create(dx_arrow), FadeIn(dx_text),
            Create(dy_arrow), FadeIn(dy_text),
            run_time=1.2,
        )

        bottom_text = Text(
            "Displacement = final position - initial position",
            font_size=20,
            color=TEXT_NAVY,
        ).to_edge(DOWN, buff=0.4)

        self.play(FadeIn(bottom_text), run_time=0.8)
        self.wait(1.0)

        # ── ACT 5: The key insight (~3 s) ───────────────────────────────────
        fade_group = VGroup(
            axes, grid, x_labels, y_labels,
            origin_dot, origin_label,
            obj_dot, ghost_dot, ghost_label,
            new_pos_vector, new_pos_label, coord_label_2,
            dx_arrow, dx_text, dy_arrow, dy_text,
            bottom_text,
        )

        insight_text = Text(
            "Only start and end matter.\nPath is irrelevant.",
            font_size=24,
            color=TEXT_NAVY,
            line_spacing=1.4,
        ).to_edge(DOWN, buff=0.5)

        self.play(
            fade_group.animate.set_opacity(0.15),
            FadeOut(bottom_text),
            run_time=0.8,
        )
        self.play(
            disp_arrow.animate.set_stroke(width=6),
            disp_label.animate.set_opacity(1),
            FadeIn(insight_text),
            run_time=0.7,
        )

        self.wait(2.0)

        # Fade everything out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=0.8,
        )
