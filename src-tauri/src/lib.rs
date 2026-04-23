use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaleLineInput {
    /// Selling price in paise (sell_price * 100)
    sell_price: i64,
    /// VAT in basis points (vat_percent * 100), e.g. 18% → 1800
    vat_rate: i64,
    /// Individual unit count
    quantity: i64,
    /// Full pack count
    pack_count: i64,
    /// Items per pack (used when is_split_pack = true)
    items_per_pack: i64,
    /// True when selling individual items from inside a pack
    is_split_pack: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SaleLineResult {
    unit_price: i64,
    gross_price: i64,
    tax: i64,
    net_price: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SaleTotalsResult {
    lines: Vec<SaleLineResult>,
    total_gross: i64,
    total_tax: i64,
    total_net: i64,
}

fn calculate_line(item: &SaleLineInput) -> SaleLineResult {
    let sell_price = Decimal::new(item.sell_price, 0);
    // basis points → decimal fraction: 1800 → 0.1800
    let vat_rate = Decimal::new(item.vat_rate, 4);

    let unit_price = if item.is_split_pack && item.items_per_pack > 0 {
        (sell_price / Decimal::new(item.items_per_pack, 0)).round_dp(0)
    } else {
        sell_price
    };

    let packs_gross = sell_price * Decimal::new(item.pack_count, 0);
    let items_gross = unit_price * Decimal::new(item.quantity, 0);
    let gross = packs_gross + items_gross;
    let tax = (gross * vat_rate).round_dp(0);
    let net = gross + tax;

    SaleLineResult {
        unit_price: unit_price.to_i64().unwrap_or(0),
        gross_price: gross.to_i64().unwrap_or(0),
        tax: tax.to_i64().unwrap_or(0),
        net_price: net.to_i64().unwrap_or(0),
    }
}

#[tauri::command]
fn calculate_sale_totals(items: Vec<SaleLineInput>) -> SaleTotalsResult {
    let mut lines: Vec<SaleLineResult> = Vec::new();
    let mut total_gross: i64 = 0;
    let mut total_tax: i64 = 0;

    for item in &items {
        let result = calculate_line(item);
        total_gross += result.gross_price;
        total_tax += result.tax;
        lines.push(result);
    }

    SaleTotalsResult {
        total_net: total_gross + total_tax,
        lines,
        total_gross,
        total_tax,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, calculate_sale_totals]);

    #[cfg(not(debug_assertions))]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
