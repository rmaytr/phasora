"""
Manim animation for Concept 1.1c — Distance vs. Displacement (circular track).

Render preview:   manim -pql animations/1_1_c_distance_vs_displacement.py DistanceVsDisplacement
Render HD:        manim -pqh animations/1_1_c_distance_vs_displacement.py DistanceVsDisplacement

After rendering, copy the output MP4 to:
  public/animations/1_1_c_distance_vs_displacement.mp4

NOTE: This script uses only Text() (Pango renderer) — no LaTeX installation required.
"""

from manim import *
import numpy as np

# ─── Phasora palette ──────────────────────────────────────────────────────────
BG_WHITE = "#FFFFFF"
AXES_GREY = "#94a3b8"
DOT_BLUE = "#1d4ed8"
DISP_GREEN = "#16a34a"
COUNTER_RED = "#dc2626"
TEXT_NAVY = "#0f172a"


class DistanceVsDisplacement(Scene):
    def construct(self):
        self.camera.background_color = BG_WHITE

        # ── Track setup ─────────────────────────────────────────────────────
        # Elliptical track (oval running track)
        a = 3.2  # semi-major axis (horizontal)
        b = 2.0  # semi-minor axis (vertical)
        track_center = LEFT * 0.8

        track = Ellipse(
            width=2 * a, height=2 * b,
            color=AXES_GREY, stroke_width=3,
        ).move_to(track_center)

        # Circumference approximation for an ellipse (Ramanujan)
        h = ((a - b) / (a + b)) ** 2
        circumference = np.pi * (a + b) * (1 + 3 * h / (10 + np.sqrt(4 - 3 * h)))

        # Start/finish marker at rightmost point
        start_pos = track_center + RIGHT * a
        start_marker = Line(
            start_pos + UP * 0.3,
            start_pos + DOWN * 0.3,
            color=TEXT_NAVY, stroke_width=3,
        )
        start_text = Text(
            "START / FINISH", font_size=10, color=TEXT_NAVY,
            weight=BOLD,
        ).next_to(start_marker, DOWN, buff=0.15)

        # Runner dot
        runner = Dot(start_pos, radius=0.14, color=DOT_BLUE, z_index=5)

        # ── Counters ────────────────────────────────────────────────────────
        counter_group = VGroup()

        dist_title = Text(
            "DISTANCE", font_size=10, color=TEXT_NAVY,
            weight=BOLD,
        )
        dist_value = Text(
            "0 m", font_size=22, color=TEXT_NAVY,
        )
        dist_box = VGroup(dist_title, dist_value).arrange(DOWN, buff=0.1)

        disp_title = Text(
            "DISPLACEMENT", font_size=10, color=TEXT_NAVY,
            weight=BOLD,
        )
        disp_value = Text(
            "0 m", font_size=22, color=DISP_GREEN,
        )
        disp_box = VGroup(disp_title, disp_value).arrange(DOWN, buff=0.1)

        counter_group = VGroup(dist_box, disp_box).arrange(DOWN, buff=0.5)
        counter_group.to_corner(UR, buff=0.6)

        # Surrounding box
        counter_bg = SurroundingRectangle(
            counter_group, color=AXES_GREY,
            stroke_width=1, buff=0.2,
            corner_radius=0.1, fill_opacity=0.03,
        )

        # ── Step 1 (0-2s): Setup ────────────────────────────────────────────
        self.play(
            Create(track, run_time=1.0),
            FadeIn(start_marker),
            FadeIn(start_text),
        )
        self.play(
            FadeIn(runner, scale=1.3),
            FadeIn(counter_bg),
            FadeIn(counter_group),
            run_time=0.6,
        )
        self.wait(0.4)

        # ── Step 2 (2-14s): Runner completes one full lap ───────────────────
        # We animate the runner along the ellipse while updating counters
        # and a displacement arrow

        # Parametric angle tracker (0 to TAU for one full lap)
        angle = ValueTracker(0)

        def get_track_point(t):
            """Point on ellipse at angle t (0 = rightmost, going counterclockwise)."""
            return track_center + np.array([
                a * np.cos(t),
                b * np.sin(t),
                0,
            ])

        # Update runner position
        runner.add_updater(
            lambda m: m.move_to(get_track_point(angle.get_value()))
        )

        # Displacement arrow from start to current position
        disp_arrow = always_redraw(lambda: Arrow(
            start_pos,
            get_track_point(angle.get_value()),
            buff=0,
            color=DISP_GREEN,
            stroke_width=3,
            max_tip_length_to_length_ratio=0.15,
        ) if np.linalg.norm(
            get_track_point(angle.get_value()) - start_pos
        ) > 0.15 else Dot(start_pos, radius=0.01, fill_opacity=0))

        self.add(disp_arrow)

        # We need to update the text counters during animation
        # Use a custom updater with DecimalNumber would be complex,
        # so we'll do a step-by-step animation with intermediate updates

        total_steps = 48  # frames of discrete updates
        step_angle = TAU / total_steps

        for step in range(total_steps):
            target_angle = (step + 1) * step_angle
            fraction = (step + 1) / total_steps

            # Distance is proportional to arc length traveled
            dist_m = fraction * 400  # 400m track

            # Displacement: straight-line from start to current point
            current_pt = get_track_point(target_angle)
            disp_m = np.linalg.norm(current_pt - start_pos) / a * (400 / (2 * np.pi)) * np.linalg.norm(current_pt - start_pos) / np.linalg.norm(current_pt - start_pos) if np.linalg.norm(current_pt - start_pos) > 0.01 else 0
            # More accurate: map screen distance to track meters
            # Max displacement occurs at angle = PI (opposite side)
            # At screen level, max distance = 2*a
            # At track level, that's the diameter equivalent
            screen_disp = np.linalg.norm(current_pt - start_pos)
            max_screen_disp = 2 * a  # diameter
            disp_m = screen_disp / max_screen_disp * 400 / np.pi * np.pi  # scale
            # Simplify: displacement in meters proportional to screen distance
            disp_m = screen_disp * (200 / a)  # when at opposite side (2a away), disp = 400/pi ~ 127m ... let's use a simpler model
            # Actually for a circle: displacement = 2R*sin(theta/2) where theta is angle traveled
            # For our 400m track: R = 400/(2*pi) = 63.66m
            R_meters = 400 / (2 * np.pi)
            disp_m = 2 * R_meters * abs(np.sin(target_angle / 2))

            # Update counter texts
            new_dist = Text(
                f"{dist_m:.0f} m", font_size=22, color=TEXT_NAVY,
            ).move_to(dist_value.get_center())
            new_disp = Text(
                f"{disp_m:.0f} m", font_size=22,
                color=DISP_GREEN if disp_m > 0.5 else COUNTER_RED,
            ).move_to(disp_value.get_center())

            self.play(
                angle.animate.set_value(target_angle),
                FadeOut(dist_value, run_time=0.01),
                FadeOut(disp_value, run_time=0.01),
                FadeIn(new_dist, run_time=0.01),
                FadeIn(new_disp, run_time=0.01),
                run_time=0.22,
                rate_func=linear,
            )
            dist_value = new_dist
            disp_value = new_disp

        runner.clear_updaters()

        # ── Step 3 (14-17s): Runner at finish line ──────────────────────────
        # Final counters
        final_dist = Text(
            "400 m", font_size=24, color=TEXT_NAVY, weight=BOLD,
        ).move_to(dist_value.get_center())
        final_disp = Text(
            "0 m", font_size=24, color=COUNTER_RED, weight=BOLD,
        ).move_to(disp_value.get_center())

        self.play(
            FadeOut(dist_value), FadeOut(disp_value),
            FadeIn(final_dist), FadeIn(final_disp),
            run_time=0.4,
        )

        text_a = Text(
            "400 meters traveled.", font_size=20, color=TEXT_NAVY,
        ).to_edge(DOWN, buff=0.7)
        text_b = Text(
            "0 meters displaced.", font_size=20, color=COUNTER_RED, weight=BOLD,
        ).next_to(text_a, DOWN, buff=0.12)

        self.play(FadeIn(text_a), FadeIn(text_b), run_time=0.6)
        self.wait(2.0)

        # ── Step 4 (17-20s): The punchline ──────────────────────────────────
        self.play(FadeOut(text_a), FadeOut(text_b), run_time=0.3)

        punchline = Text(
            "Distance measures the path.\nDisplacement measures the result.",
            font_size=20, color=TEXT_NAVY,
            line_spacing=1.4,
        ).to_edge(DOWN, buff=0.5)

        self.play(
            FadeIn(punchline),
            run_time=0.6,
        )
        self.wait(2.5)

        # Fade everything out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=0.8,
        )
