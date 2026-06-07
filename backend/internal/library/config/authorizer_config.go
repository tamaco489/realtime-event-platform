package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

type AuthorizerConfig struct {
	Auth AuthConfig
}

func AuthorizerLoad() (*AuthorizerConfig, error) {
	cfg, err := env.ParseAs[AuthorizerConfig]()
	if err != nil {
		return nil, fmt.Errorf("parse authorizer config: %w", err)
	}
	return &cfg, nil
}
