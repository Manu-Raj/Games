import pygame
import random
import sys

# --- Setup ---
pygame.init()
WIDTH, HEIGHT = 420, 520
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("2048")
clock = pygame.time.Clock()
FONT = pygame.font.SysFont("arial", 40, bold=True)
SMALL_FONT = pygame.font.SysFont("arial", 24, bold=True)

GRID_SIZE = 4
TILE_SIZE = 90
PADDING = 10
TOP_SPACE = 100

# --- Colors ---
COLORS = {
    0:(205,193,180), 2:(238,228,218), 4:(237,224,200),
    8:(242,177,121), 16:(245,149,99), 32:(246,124,95),
    64:(246,94,59), 128:(237,207,114), 256:(237,204,97),
    512:(237,200,80), 1024:(237,197,63), 2048:(237,194,46)
}

BG_COLOR = (250,248,239)
TEXT_DARK = (119,110,101)
TEXT_LIGHT = (249,246,242)

# --- Game State ---
board = [[0]*GRID_SIZE for _ in range(GRID_SIZE)]
score = 0

# --- Tile Logic ---
def add_tile():
    empty = [(r,c) for r in range(GRID_SIZE) for c in range(GRID_SIZE) if board[r][c] == 0]
    if empty:
        r,c = random.choice(empty)
        board[r][c] = random.choice([2,2,2,4])

def compress(row):
    new_row = [i for i in row if i != 0]
    new_row += [0]*(GRID_SIZE - len(new_row))
    return new_row

def merge(row):
    global score
    for i in range(GRID_SIZE-1):
        if row[i] == row[i+1] and row[i] != 0:
            row[i] *= 2
            score += row[i]
            row[i+1] = 0
    return row

def move_left():
    global board
    changed = False
    new_board = []
    for row in board:
        compressed = compress(row)
        merged = merge(compressed)
        final = compress(merged)
        if final != row:
            changed = True
        new_board.append(final)
    board = new_board
    return changed

def reverse():
    global board
    board = [row[::-1] for row in board]

def transpose():
    global board
    board = [list(row) for row in zip(*board)]

def move_right():
    reverse()
    changed = move_left()
    reverse()
    return changed

def move_up():
    transpose()
    changed = move_left()
    transpose()
    return changed

def move_down():
    transpose()
    changed = move_right()
    transpose()
    return changed

def can_move():
    for r in range(GRID_SIZE):
        for c in range(GRID_SIZE):
            if board[r][c] == 0:
                return True
            if c < GRID_SIZE-1 and board[r][c] == board[r][c+1]:
                return True
            if r < GRID_SIZE-1 and board[r][c] == board[r+1][c]:
                return True
    return False

# --- Drawing ---
def draw_board():
    screen.fill(BG_COLOR)

    # Score
    score_text = SMALL_FONT.render(f"Score: {score}", True, TEXT_DARK)
    screen.blit(score_text, (20, 20))

    # Grid
    for r in range(GRID_SIZE):
        for c in range(GRID_SIZE):
            value = board[r][c]
            rect = pygame.Rect(
                c*TILE_SIZE + (c+1)*PADDING,
                r*TILE_SIZE + (r+1)*PADDING + TOP_SPACE,
                TILE_SIZE, TILE_SIZE
            )
            pygame.draw.rect(screen, COLORS.get(value,(60,58,50)), rect, border_radius=8)

            if value:
                color = TEXT_DARK if value <= 4 else TEXT_LIGHT
                text = FONT.render(str(value), True, color)
                screen.blit(text, text.get_rect(center=rect.center))

def draw_game_over():
    overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    overlay.fill((0,0,0,180))
    screen.blit(overlay, (0,0))

    text = FONT.render("Game Over", True, (255,255,255))
    sub = SMALL_FONT.render("Press R to Restart", True, (255,255,255))
    screen.blit(text, text.get_rect(center=(WIDTH//2, HEIGHT//2 - 20)))
    screen.blit(sub, sub.get_rect(center=(WIDTH//2, HEIGHT//2 + 20)))

# --- Start Game ---
add_tile()
add_tile()

# --- Main Loop ---
running = True
game_over = False

while running:
    clock.tick(60)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        if event.type == pygame.KEYDOWN:
            if not game_over:
                moved = False
                if event.key == pygame.K_LEFT:
                    moved = move_left()
                elif event.key == pygame.K_RIGHT:
                    moved = move_right()
                elif event.key == pygame.K_UP:
                    moved = move_up()
                elif event.key == pygame.K_DOWN:
                    moved = move_down()

                if moved:
                    add_tile()
                    if not can_move():
                        game_over = True

            if event.key == pygame.K_r:
                board = [[0]*GRID_SIZE for _ in range(GRID_SIZE)]
                score = 0
                add_tile()
                add_tile()
                game_over = False

    draw_board()
    if game_over:
        draw_game_over()

    pygame.display.flip()

pygame.quit()
sys.exit()
