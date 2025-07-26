use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use rand::distr::{Alphanumeric, SampleString};
use std::sync::{Arc, Mutex};

#[derive(Clone, Serialize, Deserialize)]
struct Captcha {
    id: String,
    captcha: String,
    // TODO: expires_in
}

impl Captcha {
    fn new() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            captcha: Alphanumeric.sample_string(&mut rand::rng(), 7),
        }
    }
}

struct CaptchaState {
    captchas: Arc<Mutex<Vec<Captcha>>>
}

#[get("/challenge")]
async fn get_challenge(captcha_data: web::Data<CaptchaState>) -> impl Responder {
    let captcha = Captcha::new();

    captcha_data.captchas.lock().unwrap().push(captcha.clone());
    HttpResponse::Ok().json(web::Json(captcha.clone()))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let captchas: Vec<Captcha> = Vec::new();

    let captcha_data = web::Data::new(CaptchaState {
        captchas: Arc::new(Mutex::new(captchas))
    });

    HttpServer::new({
        move || {
            App::new()
                .app_data(captcha_data.clone())
                .service(get_challenge)
        }
    })
    .bind(("127.0.0.1", 8080))
    .unwrap()
    .run()
    .await
}
