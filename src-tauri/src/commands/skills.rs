use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct CustomSkill {
    pub name: String,
    pub description: String,
    pub icon: String,
    pub usage: Option<String>,
    pub category: Option<String>,
    pub examples: Option<Vec<String>>,
}

/// Get the user's Claude skills directory (~/.claude/skills/)
fn get_skills_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    Ok(home.join(".claude").join("skills"))
}

/// List all custom skills from ~/.claude/skills/
#[tauri::command]
pub async fn list_custom_skills(_app: AppHandle) -> Result<Vec<CustomSkill>, String> {
    let skills_dir = get_skills_dir()?;

    if !skills_dir.exists() {
        return Ok(Vec::new());
    }

    let mut skills = Vec::new();

    let entries = fs::read_dir(&skills_dir)
        .map_err(|e| format!("Failed to read skills directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        // Only process directories
        if !path.is_dir() {
            continue;
        }

        // Look for SKILL.md file inside the directory
        let skill_file = path.join("SKILL.md");
        if !skill_file.exists() {
            continue;
        }

        // Read and parse the skill file
        match parse_skill_file(&skill_file) {
            Ok(skill) => skills.push(skill),
            Err(e) => eprintln!("Failed to parse skill file {:?}: {}", skill_file, e),
        }
    }

    Ok(skills)
}

/// Create a new custom skill
#[tauri::command]
pub async fn create_custom_skill(
    _app: AppHandle,
    skill: CustomSkill,
) -> Result<(), String> {
    let skills_dir = get_skills_dir()?;

    // Create skills directory if it doesn't exist
    fs::create_dir_all(&skills_dir)
        .map_err(|e| format!("Failed to create skills directory: {}", e))?;

    // Generate directory name from skill name (remove leading /)
    let skill_name = skill.name.trim_start_matches('/');
    let skill_dir = skills_dir.join(skill_name);

    // Check if directory already exists
    if skill_dir.exists() {
        return Err(format!("Skill '{}' already exists", skill.name));
    }

    // Create skill directory
    fs::create_dir(&skill_dir)
        .map_err(|e| format!("Failed to create skill directory: {}", e))?;

    // Generate skill file content
    let content = generate_skill_content(&skill);

    // Write SKILL.md file
    let file_path = skill_dir.join("SKILL.md");
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write skill file: {}", e))?;

    Ok(())
}

/// Update an existing custom skill
#[tauri::command]
pub async fn update_custom_skill(
    _app: AppHandle,
    old_name: String,
    skill: CustomSkill,
) -> Result<(), String> {
    let skills_dir = get_skills_dir()?;

    // Get old and new directory paths
    let old_skill_name = old_name.trim_start_matches('/');
    let old_dir = skills_dir.join(old_skill_name);

    let new_skill_name = skill.name.trim_start_matches('/');
    let new_dir = skills_dir.join(new_skill_name);

    // Check if old directory exists
    if !old_dir.exists() {
        return Err(format!("Skill '{}' not found", old_name));
    }

    // Generate new content
    let content = generate_skill_content(&skill);

    // If name changed, rename directory
    if old_dir != new_dir {
        // Check if new name already exists
        if new_dir.exists() {
            return Err(format!("Skill '{}' already exists", skill.name));
        }

        fs::rename(&old_dir, &new_dir)
            .map_err(|e| format!("Failed to rename skill directory: {}", e))?;
    }

    // Write updated SKILL.md file
    let file_path = new_dir.join("SKILL.md");
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write skill file: {}", e))?;

    Ok(())
}

/// Delete a custom skill
#[tauri::command]
pub async fn delete_custom_skill(
    _app: AppHandle,
    name: String,
) -> Result<(), String> {
    let skills_dir = get_skills_dir()?;

    let skill_name = name.trim_start_matches('/');
    let skill_dir = skills_dir.join(skill_name);

    if !skill_dir.exists() {
        return Err(format!("Skill '{}' not found", name));
    }

    fs::remove_dir_all(&skill_dir)
        .map_err(|e| format!("Failed to delete skill directory: {}", e))?;

    Ok(())
}

/// Parse a skill markdown file
fn parse_skill_file(path: &PathBuf) -> Result<CustomSkill, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Parse frontmatter (YAML between --- delimiters)
    let mut lines = content.lines();

    // Check for frontmatter start
    if lines.next() != Some("---") {
        return Err("No frontmatter found".to_string());
    }

    let mut name = String::new();
    let mut description = String::new();
    let mut icon = "✨".to_string(); // Default icon
    let mut usage: Option<String> = None;
    let mut category: Option<String> = None;
    let mut examples: Option<Vec<String>> = None;

    // Parse frontmatter
    for line in &mut lines {
        if line == "---" {
            break;
        }

        if let Some((key, value)) = line.split_once(':') {
            let key = key.trim();
            let value = value.trim();

            match key {
                "name" => name = value.to_string(),
                "description" => description = value.to_string(),
                "icon" => icon = value.to_string(),
                "usage" => usage = Some(value.to_string()),
                "category" => category = Some(value.to_string()),
                _ => {} // Ignore other fields
            }
        }
    }

    // Parse body for examples (look for ## Examples section)
    let body: Vec<&str> = lines.collect();
    let body_text = body.join("\n");

    if let Some(examples_start) = body_text.find("## Examples") {
        let examples_section = &body_text[examples_start..];
        let example_lines: Vec<String> = examples_section
            .lines()
            .skip(1) // Skip "## Examples" line
            .filter_map(|line| {
                let trimmed = line.trim();
                if trimmed.starts_with('-') || trimmed.starts_with('*') {
                    Some(trimmed.trim_start_matches('-').trim_start_matches('*').trim().to_string())
                } else {
                    None
                }
            })
            .collect();

        if !example_lines.is_empty() {
            examples = Some(example_lines);
        }
    }

    if name.is_empty() || description.is_empty() {
        return Err("Skill missing required fields (name, description)".to_string());
    }

    // Add / prefix if not present
    let name = if !name.starts_with('/') {
        format!("/{}", name)
    } else {
        name
    };

    Ok(CustomSkill {
        name,
        description,
        icon,
        usage,
        category,
        examples,
    })
}

/// Generate skill file content from CustomSkill struct
fn generate_skill_content(skill: &CustomSkill) -> String {
    let mut content = String::new();

    // Frontmatter
    content.push_str("---\n");
    content.push_str(&format!("name: {}\n", skill.name.trim_start_matches('/')));
    content.push_str(&format!("description: {}\n", skill.description));
    content.push_str("user-invocable: true\n");

    if let Some(ref category) = skill.category {
        content.push_str(&format!("category: {}\n", category));
    }

    content.push_str("---\n\n");

    // Main heading
    content.push_str(&format!("# {} {}\n\n", skill.icon, skill.name));

    // Description
    content.push_str(&format!("{}\n\n", skill.description));

    // Usage
    if let Some(ref usage) = skill.usage {
        content.push_str("## Usage\n\n");
        content.push_str(&format!("```\n{}\n```\n\n", usage));
    }

    // Examples
    if let Some(ref examples) = skill.examples {
        if !examples.is_empty() {
            content.push_str("## Examples\n\n");
            for example in examples {
                content.push_str(&format!("- {}\n", example));
            }
            content.push_str("\n");
        }
    }

    // Instructions section
    content.push_str("## Instructions\n\n");
    content.push_str("When the user invokes this skill:\n\n");
    content.push_str("1. Read the user's request carefully\n");
    content.push_str("2. Perform the requested action\n");
    content.push_str("3. Provide clear feedback about what was done\n");

    content
}
